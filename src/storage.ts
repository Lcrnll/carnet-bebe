import type { AppData, BabyProfile, GrowthEntry, Appointment, Vaccine, ChecklistItem, NoteEntry, Document } from './types';
import { defaultVaccines } from './data/vaccines';
import { defaultChecklist } from './data/checklist';
import { pushToCloud, isCloudConfigured } from './cloud';

const KEY = 'carnet-bebe-data';

const now = () => new Date().toISOString();

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
        deletedIds:   parsed.deletedIds   ?? [],
      };
    }
  } catch {}
  return {
    profile: null, growth: [], appointments: [],
    vaccines: defaultVaccines(), checklist: defaultChecklist(),
    notes: [], documents: [], deletedIds: [],
  };
}

function save(data: AppData) {
  localStorage.setItem(KEY, JSON.stringify(data));
  if (isCloudConfigured()) {
    pushToCloud(data).catch(console.error);
  }
}

function addDeleted(id: string) {
  const d = load();
  d.deletedIds = [...new Set([...(d.deletedIds ?? []), id])];
  return d;
}

export function getData(): AppData { return load(); }

export function saveProfile(profile: BabyProfile) {
  const d = load();
  d.profile = { ...profile, updatedAt: now() };
  save(d);
}

export function addGrowth(entry: GrowthEntry) {
  const d = load();
  d.growth = [{ ...entry, updatedAt: now() }, ...d.growth];
  save(d);
}
export function updateGrowth(entry: GrowthEntry) {
  const d = load();
  d.growth = d.growth.map(g => g.id === entry.id ? { ...entry, updatedAt: now() } : g);
  save(d);
}
export function deleteGrowth(id: string) {
  const d = addDeleted(id);
  d.growth = d.growth.filter(g => g.id !== id);
  save(d);
}

export function addAppointment(a: Appointment) {
  const d = load();
  d.appointments = [{ ...a, updatedAt: now() }, ...d.appointments];
  save(d);
}
export function updateAppointment(a: Appointment) {
  const d = load();
  d.appointments = d.appointments.map(x => x.id === a.id ? { ...a, updatedAt: now() } : x);
  save(d);
}
export function deleteAppointment(id: string) {
  const d = addDeleted(id);
  d.appointments = d.appointments.filter(x => x.id !== id);
  save(d);
}

export function updateVaccine(v: Vaccine) {
  const d = load();
  d.vaccines = d.vaccines.map(x => x.id === v.id ? { ...v, updatedAt: now() } : x);
  save(d);
}

export function updateChecklistItem(item: ChecklistItem) {
  const d = load();
  d.checklist = d.checklist.map(x => x.id === item.id ? { ...item, updatedAt: now() } : x);
  save(d);
}
export function addChecklistItem(item: ChecklistItem) {
  const d = load();
  d.checklist = [...d.checklist, { ...item, updatedAt: now() }];
  save(d);
}
export function deleteChecklistItem(id: string) {
  const d = addDeleted(id);
  d.checklist = d.checklist.filter(x => x.id !== id);
  save(d);
}

export function addNote(n: NoteEntry) {
  const d = load();
  d.notes = [{ ...n, updatedAt: now() }, ...d.notes];
  save(d);
}
export function updateNote(n: NoteEntry) {
  const d = load();
  d.notes = d.notes.map(x => x.id === n.id ? { ...n, updatedAt: now() } : x);
  save(d);
}
export function deleteNote(id: string) {
  const d = addDeleted(id);
  d.notes = d.notes.filter(x => x.id !== id);
  save(d);
}

export function addDocument(doc: Document) {
  const d = load();
  d.documents = [...d.documents, { ...doc, updatedAt: now() }];
  save(d);
}
export function updateDocument(doc: Document) {
  const d = load();
  d.documents = d.documents.map(x => x.id === doc.id ? { ...doc, updatedAt: now() } : x);
  save(d);
}
export function deleteDocument(id: string) {
  const d = addDeleted(id);
  d.documents = d.documents.filter(x => x.id !== id);
  save(d);
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
