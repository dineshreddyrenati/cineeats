import { useState } from 'react';
import { Film, LayoutDashboard, Calendar, QrCode, Gift, Building2, LogOut, Menu, User, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import TheaterHome from './TheaterHome';
import ManageShows from './ManageShows';
import QRVerification from './QRVerification';
import ComboDealManager from './ComboDealManager';
import TheaterSetup from './TheaterSetup';
import CollaborationCenter from './CollaborationCenter';
import PayoutDashboard from '../shared/PayoutDashboard';

type Tab = 'home' | 'shows' | 'qr' | 'collaborate' | 'combos' | 'payouts' | 'setup';

export default function TheaterDashboard() {
  const { profile, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'shows', label: 'Manage Shows', icon: <Calendar size={20} /> },
    { id: 'qr', label: 'QR Verify', icon: <QrCode size={20} /> },
    { id: 'collaborate', label: 'Collaborations', icon: <Users size={20} /> },
    { id: 'combos', label: 'Combo Deals', icon: <Gift size={20} /> },
    { id: 'payouts', label: 'Payouts', icon: <TrendingUp size={20} /> },
    { id: 'setup', label: 'Theater Setup', icon: <Building2 size={20} /> },
  ];

  const renderContent = () => {
    switch (tab) {
      case 'home': return <TheaterHome onNavigate={setTab} />;
      case 'shows': return <ManageShows />;
      case 'qr': return <QRVerification />;
      case 'collaborate': return <CollaborationCenter onBack={() => setTab('home')} />;
      case 'combos': return <ComboDealManager />;
      case 'payouts': return <PayoutDashboard partnerType="theater" onBack={() => setTab('home')} />;
      case 'setup': return <TheaterSetup />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:flex lg:flex-col`}>
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Film size={18} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white block">CineEats</span>
              <span className="text-blue-400 text-xs">Theater Partner</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <User size={18} className="text-blue-400" />
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
                tab === item.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
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
          <span className="text-white font-bold">Theater Dashboard</span>
          <div />
        </header>
        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  );
}
