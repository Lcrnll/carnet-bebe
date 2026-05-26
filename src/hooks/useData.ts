import { useState, useCallback, useEffect, useRef } from 'react';
import type { AppData } from '../types';
import { getData } from '../storage';
import { subscribeToCloud, pullFromCloud, pushToCloud, isCloudConfigured } from '../cloud';

const LOCAL_KEY = 'carnet-bebe-data';

/** Retourne true si `a` semble plus complet que `b` */
function isMoreComplete(a: AppData, b: AppData): boolean {
  if (a.profile && !b.profile) return true;
  if (!a.profile && b.profile) return false;
  // Comparer le nombre total d'entrées
  const scoreA = a.growth.length + a.appointments.length + a.notes.length + a.vaccines.filter(v => v.done).length;
  const scoreB = b.growth.length + b.appointments.length + b.notes.length + b.vaccines.filter(v => v.done).length;
  return scoreA > scoreB;
}

function applyCloudData(cloudData: AppData, setData: (d: AppData) => void) {
  const localData = getData();
  // Si le cloud est vide/moins complet que le local, on pousse le local vers le cloud
  if (isMoreComplete(localData, cloudData)) {
    pushToCloud(localData).catch(console.error);
    return;
  }
  // Sinon on applique les données du cloud
  localStorage.setItem(LOCAL_KEY, JSON.stringify(cloudData));
  setData(cloudData);
}

export function useData() {
  const [data, setData] = useState<AppData>(() => getData());
  const ignoreNext = useRef(false);

  const refresh = useCallback(() => {
    setData(getData());
  }, []);

  // Abonnement temps réel à Firebase
  useEffect(() => {
    if (!isCloudConfigured()) return;

    const unsubscribe = subscribeToCloud((cloudData) => {
      if (ignoreNext.current) { ignoreNext.current = false; return; }
      applyCloudData(cloudData, setData);
    });

    return () => { unsubscribe?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quand l'app revient au premier plan, on tire les dernières données du cloud
  useEffect(() => {
    if (!isCloudConfigured()) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const cloudData = await pullFromCloud();
        if (cloudData) {
          applyCloudData(cloudData, setData);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, refresh };
}
