import { useState } from 'react';
import { UtensilsCrossed, LayoutDashboard, ShoppingBag, BookOpen, Calendar, TrendingUp, Settings, LogOut, Menu, Users, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import RestaurantHome from './RestaurantHome';
import MenuManager from './MenuManager';
import OrderManager from './OrderManager';
import ReservationManager from './ReservationManager';
import CommissionDashboard from './CommissionDashboard';
import RestaurantSetup from './RestaurantSetup';
import RestaurantCollaborationCenter from './CollaborationCenter';
import PayoutDashboard from '../shared/PayoutDashboard';

type Tab = 'home' | 'menu' | 'orders' | 'reservations' | 'collaborate' | 'commissions' | 'payouts' | 'setup';

export default function RestaurantDashboard() {
  const { profile, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'menu', label: 'Menu', icon: <BookOpen size={20} /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag size={20} /> },
    { id: 'reservations', label: 'Reservations', icon: <Calendar size={20} /> },
    { id: 'collaborate', label: 'Collaborations', icon: <Users size={20} /> },
    { id: 'payouts', label: 'Payouts', icon: <TrendingUp size={20} /> },
    { id: 'setup', label: 'Restaurant Setup', icon: <Settings size={20} /> },
  ];

  const renderContent = () => {
    switch (tab) {
      case 'home': return <RestaurantHome onNavigate={setTab} />;
      case 'menu': return <MenuManager />;
      case 'orders': return <OrderManager />;
      case 'reservations': return <ReservationManager />;
      case 'collaborate': return <RestaurantCollaborationCenter onBack={() => setTab('home')} />;
      case 'payouts': return <PayoutDashboard partnerType="restaurant" onBack={() => setTab('home')} />;
      case 'setup': return <RestaurantSetup />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:flex lg:flex-col`}>
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
              <UtensilsCrossed size={18} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white block">CineEats</span>
              <span className="text-emerald-400 text-xs">Restaurant Partner</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <User size={18} className="text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{profile?.full_name}</p>
              <p className="text-gray-500 text-xs truncate">{profile?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === item.id ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-all"
          >
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-gray-900/80 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-gray-400 hover:text-white">
            <Menu size={24} />
          </button>
          <span className="text-white font-bold">Restaurant Dashboard</span>
          <div />
        </header>
        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  );
}
