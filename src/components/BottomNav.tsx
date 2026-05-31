import { useLocation, Link } from 'react-router-dom';
import { Home, TrendingUp, Calendar, Shield, BookOpen, Settings } from 'lucide-react';

const navItems = [
  { to: '/',        icon: Home,       label: 'Accueil' },
  { to: '/sante',   icon: TrendingUp, label: 'Santé' },
  { to: '/rdv',     icon: Calendar,   label: 'RDV' },
  { to: '/vaccins', icon: Shield,      label: 'Vaccins' },
  { to: '/journal', icon: BookOpen,    label: 'Journal' },
  { to: '/reglages',icon: Settings,    label: 'Réglages' },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded-xl transition-all min-w-0 flex-1 no-underline ${
                isActive ? 'text-pink-500' : 'text-gray-400'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-pink-50' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
