import type { AppData } from './types';

/**
 * Fusionne les données locales et cloud :
 * - Tous les éléments des deux sources sont conservés (union par ID)
 * - En cas de conflit sur un même ID, le plus récemment modifié gagne
 * - Les suppressions sont tracées dans deletedIds pour ne pas réapparaître
 */
export function mergeData(local: AppData, cloud: AppData): AppData {
  const deletedIds = new Set([
    ...(local.deletedIds ?? []),
    ...(cloud.deletedIds ?? []),
  ]);

  function mergeList<T extends { id: string; updatedAt?: string }>(
    a: T[], b: T[]
  ): T[] {
    const map = new Map<string, T>();
    [...a, ...b].forEach(item => {
      if (deletedIds.has(item.id)) return; // élément supprimé → ignoré
      const existing = map.get(item.id);
      if (!existing || (item.updatedAt ?? '0') >= (existing.updatedAt ?? '0')) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }

  // Profil : on garde le plus récent
  let profile = local.profile;
  if (cloud.profile && local.profile) {
    profile = (cloud.profile.updatedAt ?? '0') >= (local.profile.updatedAt ?? '0')
      ? cloud.profile : local.profile;
  } else {
    profile = cloud.profile ?? local.profile;
  }

  return {
    profile,
    growth:       mergeList(local.growth,       cloud.growth      ).sort((a, b) => b.date.localeCompare(a.date)),
    appointments: mergeList(local.appointments, cloud.appointments).sort((a, b) => a.date.localeCompare(b.date)),
    vaccines:     mergeList(local.vaccines,     cloud.vaccines    ),
    checklist:    mergeList(local.checklist,    cloud.checklist   ),
    notes:        mergeList(local.notes,        cloud.notes       ).sort((a, b) => b.date.localeCompare(a.date)),
    documents:    mergeList(local.documents,    cloud.documents   ),
    deletedIds:   Array.from(deletedIds),
  };
}
