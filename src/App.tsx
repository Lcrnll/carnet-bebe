import { Routes, Route } from 'react-router-dom';
import { useData } from './hooks/useData';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { HealthTracking } from './pages/HealthTracking';
import { Appointments } from './pages/Appointments';
import { Vaccines } from './pages/Vaccines';
import { Checklist } from './pages/Checklist';
import { Notes } from './pages/Notes';
import { Documents } from './pages/Documents';
import { Settings } from './pages/Settings';

export default function App() {
  const { data, refresh } = useData();

  return (
    <div className="min-h-svh bg-pink-50 max-w-lg mx-auto relative">
      <main>
        <Routes>
          <Route path="/" element={<Dashboard data={data} onRefresh={refresh} />} />
          <Route path="/sante" element={<HealthTracking data={data} onRefresh={refresh} />} />
          <Route path="/rdv" element={<Appointments data={data} onRefresh={refresh} />} />
          <Route path="/vaccins" element={<Vaccines data={data} onRefresh={refresh} />} />
          <Route path="/checklist" element={<Checklist data={data} onRefresh={refresh} />} />
          <Route path="/notes" element={<Notes data={data} onRefresh={refresh} />} />
          <Route path="/documents" element={<Documents data={data} onRefresh={refresh} />} />
          <Route path="/reglages" element={<Settings data={data} onRefresh={refresh} />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
