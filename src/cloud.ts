import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import type { AppData } from './types';
import { defaultVaccines } from './data/vaccines';
import { defaultChecklist } from './data/checklist';
import { defaultDevelopmentMilestones } from './data/development';

const CONFIG_KEY = 'carnet-bebe-firebase';
const FAMILY_KEY  = 'carnet-bebe-family';

export interface CloudConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Configuration Firebase pré-configurée (pas besoin de la saisir manuellement)
const DEFAULT_CONFIG: CloudConfig = {
  apiKey: "AIzaSyDNxAcFlETNbahfwnEGrbJRGskcgjcfoMs",
  authDomain: "carnet-bebe-84c41.firebaseapp.com",
  projectId: "carnet-bebe-84c41",
  storageBucket: "carnet-bebe-84c41.firebasestorage.app",
  messagingSenderId: "890079821827",
  appId: "1:890079821827:web:a5640d39f4f0842e0c0e36",
};

let _db: Firestore | null = null;

/* ── Config helpers ── */
export function getCloudConfig(): CloudConfig {
  try {
    const stored = JSON.parse(localStorage.getItem(CONFIG_KEY) ?? 'null');
    return stored ?? DEFAULT_CONFIG;
  } catch { return DEFAULT_CONFIG; }
}
export function getFamilyCode(): string {
  return localStorage.getItem(FAMILY_KEY) ?? '';
}
export function isCloudConfigured(): boolean {
  const cfg = getCloudConfig();
  return !!(cfg.apiKey && cfg.projectId && getFamilyCode());
}
export function saveCloudSettings(config: CloudConfig, familyCode: string) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  localStorage.setItem(FAMILY_KEY, familyCode.trim().toLowerCase().replace(/\s+/g, '-'));
  _db = null; // force re-init
}
export function clearCloudSettings() {
  localStorage.removeItem(CONFIG_KEY);
  localStorage.removeItem(FAMILY_KEY);
  _db = null;
}

/* ── Firestore init ── */
function getDb(): Firestore | null {
  if (_db) return _db;
  const config = getCloudConfig();
  if (!config.apiKey) return null;
  try {
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(config);
    _db = getFirestore(app);
    return _db;
  } catch (e) {
    console.error('[cloud] init error', e);
    return null;
  }
}

/*
 * Version du format des données. À INCRÉMENTER à chaque ajout d'un champ
 * dans AppData. Un appareil qui voit dans le cloud une version supérieure à la
 * sienne tourne sur une ancienne version de l'app : il ne doit plus rien
 * envoyer (il effacerait les champs qu'il ne connaît pas) et se recharge.
 *   1 = avant la diversification · 2 = diversification + garde-fou de version
 */
export const SCHEMA_VERSION = 2;

let _staleClient = false;
export function isStaleClient() { return _staleClient; }

/** Détecte une version d'app périmée ; recharge la page une fois pour récupérer la nouvelle. */
export function checkCloudVersion(cloud: Pick<AppData, 'schemaVersion'>): boolean {
  if ((cloud.schemaVersion ?? 0) <= SCHEMA_VERSION) return true;
  _staleClient = true;
  if (!sessionStorage.getItem('schema-reload')) {
    sessionStorage.setItem('schema-reload', '1');
    window.location.reload();
  }
  return false;
}

function normalize(raw: Partial<AppData>): AppData {
  return {
    ...raw, // conserve les champs inconnus de cette version
    profile:      raw.profile      ?? null,
    growth:       raw.growth       ?? [],
    appointments: raw.appointments ?? [],
    vaccines:     raw.vaccines?.length  ? raw.vaccines  : defaultVaccines(),
    checklist:    raw.checklist?.length ? raw.checklist : defaultChecklist(),
    notes:        raw.notes        ?? [],
    documents:    raw.documents    ?? [],
    sleep:        raw.sleep        ?? [],
    feeding:      raw.feeding      ?? [],
    milestones:   raw.milestones   ?? [],
    development:  raw.development?.length ? raw.development : defaultDevelopmentMilestones(),
    diversification: raw.diversification ?? [],
  };
}

/* ── Pull latest data from Firestore (one-shot read) ── */
export async function pullFromCloud(): Promise<AppData | null> {
  const db = getDb();
  const code = getFamilyCode();
  if (!db || !code) return null;
  try {
    const snap = await getDoc(doc(db, 'familles', code));
    if (!snap.exists()) return null;
    return normalize(snap.data() as Partial<AppData>);
  } catch (e) {
    console.error('[cloud] pull error', e);
    return null;
  }
}

/* ── Push all data to Firestore ── */
export async function pushToCloud(data: AppData): Promise<void> {
  const db = getDb();
  const code = getFamilyCode();
  if (!db || !code || _staleClient) return;
  try {
    const payload = JSON.parse(JSON.stringify({ ...data, schemaVersion: SCHEMA_VERSION }));
    // mergeFields : chaque champ envoyé est remplacé en entier, mais un champ
    // absent de `data` (inconnu de cette version) n'est jamais supprimé du cloud.
    await setDoc(doc(db, 'familles', code), payload, { mergeFields: Object.keys(payload) });
    await saveCloudBackup(db, code, payload);
  } catch (e) {
    console.error('[cloud] push error', e);
  }
}

/* ── Sauvegardes quotidiennes dans le cloud ──
 * Un document par jour : familles/<code>--sauvegarde--AAAA-MM-JJ.
 * On garde la version la plus complète de la journée (jamais écrasée par une
 * version plus pauvre), pour pouvoir revenir en arrière après une perte. */
const BACKUP_SEP = '--sauvegarde--';
let _lastBackupCheck = '';

function countEntries(d: Partial<AppData>): number {
  return (['growth', 'appointments', 'notes', 'documents', 'sleep', 'feeding', 'milestones', 'diversification'] as const)
    .reduce((acc, k) => acc + ((d[k] as unknown[] | undefined)?.length ?? 0), 0);
}

async function saveCloudBackup(db: Firestore, code: string, payload: AppData) {
  const day = new Date().toISOString().slice(0, 10);
  const count = countEntries(payload);
  const key = `${day}:${count}`;
  if (_lastBackupCheck === key) return;
  _lastBackupCheck = key;
  const ref = doc(db, 'familles', `${code}${BACKUP_SEP}${day}`);
  const existing = await getDoc(ref);
  if (existing.exists() && countEntries(existing.data() as Partial<AppData>) > count) return;
  await setDoc(ref, { ...payload, backupOf: code, backupAt: new Date().toISOString() });
}

export interface CloudBackup { day: string; data: AppData; count: number; }

/** Sauvegardes cloud des `days` derniers jours (les plus récentes d'abord). */
export async function listCloudBackups(days = 30): Promise<CloudBackup[]> {
  const db = getDb();
  const code = getFamilyCode();
  if (!db || !code) return [];
  const out: CloudBackup[] = [];
  const dates = Array.from({ length: days }, (_, i) =>
    new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
  await Promise.all(dates.map(async day => {
    try {
      const snap = await getDoc(doc(db, 'familles', `${code}${BACKUP_SEP}${day}`));
      if (!snap.exists()) return;
      const raw = snap.data() as Partial<AppData> & { backupOf?: string; backupAt?: string };
      delete raw.backupOf; delete raw.backupAt;
      const data = normalize(raw);
      out.push({ day, data, count: countEntries(data) });
    } catch (e) { console.error('[cloud] backup read error', e); }
  }));
  return out.sort((a, b) => b.day.localeCompare(a.day));
}

/* ── Listen to Firestore changes (real-time) ── */
export function subscribeToCloud(callback: (data: AppData) => void): Unsubscribe | null {
  const db = getDb();
  const code = getFamilyCode();
  if (!db || !code) return null;
  return onSnapshot(
    doc(db, 'familles', code),
    (snap) => {
      if (!snap.exists()) return;
      callback(normalize(snap.data() as Partial<AppData>));
    },
    (err) => console.error('[cloud] subscribe error', err)
  );
}
