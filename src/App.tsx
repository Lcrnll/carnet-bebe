import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useData } from './hooks/useData';
import { BottomNav } from './components/BottomNav';

// Après un nouveau déploiement, les chunks chargés par l'app encore ouverte
// dans l'onglet peuvent ne plus exister (hash changé) : on force un reload
// complet plutôt que de laisser la page blanche.
function lazyWithReload<T extends { default: ComponentType<any> }>(loader: () => Promise<T>) {
  return lazy(() =>
    loader().catch((err) => {
      const alreadyReloaded = sessionStorage.getItem('chunk-reload');
      if (!alreadyReloaded) {
        sessionStorage.setItem('chunk-reload', '1');
        window.location.reload();
      }
      throw err;
    })
  );
}

// Code splitting : chaque page chargée à la demande
const Dashboard     = lazyWithReload(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const HealthTracking = lazyWithReload(() => import('./pages/HealthTracking').then(m => ({ default: m.HealthTracking })));
const Appointments  = lazyWithReload(() => import('./pages/Appointments').then(m => ({ default: m.Appointments })));
const Vaccines      = lazyWithReload(() => import('./pages/Vaccines').then(m => ({ default: m.Vaccines })));
const Checklist     = lazyWithReload(() => import('./pages/Checklist').then(m => ({ default: m.Checklist })));
const Journal       = lazyWithReload(() => import('./pages/Journal').then(m => ({ default: m.Journal })));
const Settings      = lazyWithReload(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-400 rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const { data, refresh } = useData();

  return (
    <div className="min-h-svh bg-pink-50 w-full relative">
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"         element={<Dashboard      data={data} onRefresh={refresh} />} />
            <Route path="/sante"    element={<HealthTracking data={data} onRefresh={refresh} />} />
            <Route path="/rdv"      element={<Appointments   data={data} onRefresh={refresh} />} />
            <Route path="/vaccins"  element={<Vaccines       data={data} onRefresh={refresh} />} />
            <Route path="/checklist" element={<Checklist     data={data} onRefresh={refresh} />} />
            <Route path="/journal"  element={<Journal        data={data} onRefresh={refresh} />} />
            <Route path="/reglages" element={<Settings       data={data} onRefresh={refresh} />} />
            {/* Compatibilité ancienne route /notes → redirige vers journal */}
            <Route path="/notes"    element={<Journal        data={data} onRefresh={refresh} />} />
          </Routes>
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
