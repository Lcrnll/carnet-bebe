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

/* ── Pull latest data from Firestore (one-shot read) ── */
export async function pullFromCloud(): Promise<AppData | null> {
  const db = getDb();
  const code = getFamilyCode();
  if (!db || !code) return null;
  try {
    const snap = await getDoc(doc(db, 'familles', code));
    if (!snap.exists()) return null;
    const raw = snap.data() as Partial<AppData>;
    return {
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
    };
  } catch (e) {
    console.error('[cloud] pull error', e);
    return null;
  }
}

/* ── Push all data to Firestore ── */
export async function pushToCloud(data: AppData): Promise<void> {
  const db = getDb();
  const code = getFamilyCode();
  if (!db || !code) return;
  try {
    await setDoc(doc(db, 'familles', code), JSON.parse(JSON.stringify(data)));
  } catch (e) {
    console.error('[cloud] push error', e);
  }
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
      const raw = snap.data() as Partial<AppData>;
      callback({
        profile:      raw.profile      ?? null,
        growth:       raw.growth       ?? [],
        appointments: raw.appointments ?? [],
        vaccines:     raw.vaccines?.length ? raw.vaccines : defaultVaccines(),
        checklist:    raw.checklist?.length ? raw.checklist : defaultChecklist(),
        notes:        raw.notes        ?? [],
        documents:    raw.documents    ?? [],
        sleep:        raw.sleep        ?? [],
        feeding:      raw.feeding      ?? [],
        milestones:   raw.milestones   ?? [],
      });
    },
    (err) => console.error('[cloud] subscribe error', err)
  );
}
