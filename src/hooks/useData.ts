import { useState, useCallback, useEffect, useRef } from 'react';
import type { AppData } from '../types';
import { getData } from '../storage';
import { subscribeToCloud, pullFromCloud, isCloudConfigured } from '../cloud';

const LOCAL_KEY = 'carnet-bebe-data';

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
      localStorage.setItem(LOCAL_KEY, JSON.stringify(cloudData));
      setData(cloudData);
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
          localStorage.setItem(LOCAL_KEY, JSON.stringify(cloudData));
          setData(cloudData);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, refresh };
}
