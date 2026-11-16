import type { AppData } from './types';

/*
 * Sauvegardes locales : une copie par jour des données de cet appareil,
 * conservée 14 jours. Filet de sécurité indépendant du cloud.
 */
const BACKUP_KEY = 'carnet-bebe-backups';
const KEEP_DAYS = 14;

type Backups = Record<string, AppData>; // AAAA-MM-JJ → données

function countEntries(d: AppData): number {
  return d.growth.length + d.appointments.length + d.notes.length + d.documents.length
    + (d.sleep?.length ?? 0) + (d.feeding?.length ?? 0) + (d.milestones?.length ?? 0)
    + (d.diversification?.length ?? 0);
}

export function getLocalBackups(): { day: string; data: AppData; count: number }[] {
  try {
    const all = JSON.parse(localStorage.getItem(BACKUP_KEY) ?? '{}') as Backups;
    return Object.entries(all)
      .map(([day, data]) => ({ day, data, count: countEntries(data) }))
      .sort((a, b) => b.day.localeCompare(a.day));
  } catch { return []; }
}

export function saveLocalBackup(data: AppData) {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const all = JSON.parse(localStorage.getItem(BACKUP_KEY) ?? '{}') as Backups;
    // On garde la version la plus complète de la journée.
    if (all[day] && countEntries(all[day]) > countEntries(data)) return;
    all[day] = data;
    const days = Object.keys(all).sort().reverse();
    days.slice(KEEP_DAYS).forEach(d => delete all[d]);
    localStorage.setItem(BACKUP_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('[backup] local backup error', e);
  }
}
