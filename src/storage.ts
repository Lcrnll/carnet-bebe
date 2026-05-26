import type { AppData, BabyProfile, GrowthEntry, Appointment, Vaccine, ChecklistItem, NoteEntry, Document } from './types';
import { defaultVaccines } from './data/vaccines';
import { defaultChecklist } from './data/checklist';
import { pushToCloud, isCloudConfigured } from './cloud';

const KEY = 'carnet-bebe-data';

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppData>;
      return {
        profile:      parsed.profile      ?? null,
        growth:       parsed.growth       ?? [],
        appointments: parsed.appointments ?? [],
        vaccines:     parsed.vaccines?.length  ? parsed.vaccines  : defaultVaccines(),
        checklist:    parsed.checklist?.length ? parsed.checklist : defaultChecklist(),
        notes:        parsed.notes        ?? [],
        documents:    parsed.documents    ?? [],
      };
    }
  } catch {}
  return {
    profile: null, growth: [], appointments: [],
    vaccines: defaultVaccines(), checklist: defaultChecklist(),
    notes: [], documents: [],
  };
}

function save(data: AppData) {
  localStorage.setItem(KEY, JSON.stringify(data));
  // Sync automatique vers Firebase si configuré
  if (isCloudConfigured()) {
    pushToCloud(data).catch(console.error);
  }
}

export function getData(): AppData { return load(); }

export function saveProfile(profile: BabyProfile) {
  const d = load(); d.profile = profile; save(d);
}

export function addGrowth(entry: GrowthEntry) {
  const d = load(); d.growth = [entry, ...d.growth]; save(d);
}
export function updateGrowth(entry: GrowthEntry) {
  const d = load(); d.growth = d.growth.map(g => g.id === entry.id ? entry : g); save(d);
}
export function deleteGrowth(id: string) {
  const d = load(); d.growth = d.growth.filter(g => g.id !== id); save(d);
}

export function addAppointment(a: Appointment) {
  const d = load(); d.appointments = [a, ...d.appointments]; save(d);
}
export function updateAppointment(a: Appointment) {
  const d = load(); d.appointments = d.appointments.map(x => x.id === a.id ? a : x); save(d);
}
export function deleteAppointment(id: string) {
  const d = load(); d.appointments = d.appointments.filter(x => x.id !== id); save(d);
}

export function updateVaccine(v: Vaccine) {
  const d = load(); d.vaccines = d.vaccines.map(x => x.id === v.id ? v : x); save(d);
}

export function updateChecklistItem(item: ChecklistItem) {
  const d = load(); d.checklist = d.checklist.map(x => x.id === item.id ? item : x); save(d);
}
export function addChecklistItem(item: ChecklistItem) {
  const d = load(); d.checklist = [...d.checklist, item]; save(d);
}
export function deleteChecklistItem(id: string) {
  const d = load(); d.checklist = d.checklist.filter(x => x.id !== id); save(d);
}

export function addNote(n: NoteEntry) {
  const d = load(); d.notes = [n, ...d.notes]; save(d);
}
export function updateNote(n: NoteEntry) {
  const d = load(); d.notes = d.notes.map(x => x.id === n.id ? n : x); save(d);
}
export function deleteNote(id: string) {
  const d = load(); d.notes = d.notes.filter(x => x.id !== id); save(d);
}

export function addDocument(doc: Document) {
  const d = load(); d.documents = [...d.documents, doc]; save(d);
}
export function updateDocument(doc: Document) {
  const d = load(); d.documents = d.documents.map(x => x.id === doc.id ? doc : x); save(d);
}
export function deleteDocument(id: string) {
  const d = load(); d.documents = d.documents.filter(x => x.id !== id); save(d);
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
