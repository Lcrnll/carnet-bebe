import { useState, useCallback, useEffect } from 'react';
import type { AppData } from '../types';
import { getData } from '../storage';
import { subscribeToCloud, pullFromCloud, pushToCloud, isCloudConfigured } from '../cloud';
import { mergeData } from '../merge';

const LOCAL_KEY = 'carnet-bebe-data';

/** Fusionne cloud + local, sauvegarde le résultat partout, met à jour le state */
async function syncAndApply(
  cloudData: AppData,
  setData: (d: AppData) => void
) {
  const localData = getData();
  const merged = mergeData(localData, cloudData);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
  setData(merged);
  // On pousse le résultat fusionné vers Firebase pour que l'autre device en bénéficie
  await pushToCloud(merged).catch(console.error);
}

export function useData() {
  const [data, setData] = useState<AppData>(() => getData());

  const refresh = useCallback(() => {
    setData(getData());
  }, []);

  // Abonnement temps réel à Firebase
  useEffect(() => {
    if (!isCloudConfigured()) return;

    const unsubscribe = subscribeToCloud((cloudData) => {
      syncAndApply(cloudData, setData);
    });

    return () => { unsubscribe?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quand l'app revient au premier plan, on fusionne avec le cloud
  useEffect(() => {
    if (!isCloudConfigured()) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const cloudData = await pullFromCloud();
        if (cloudData) {
          await syncAndApply(cloudData, setData);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, refresh };
}
