import { useState } from 'react';
import { Film, UtensilsCrossed, Calendar, ShoppingBag, Home, LogOut, Menu, Bell, User, Gift } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MovieBrowse from './MovieBrowse';
import MyBookings from './MyBookings';
import RestaurantSearch from './RestaurantSearch';
import MyOrders from './MyOrders';
import UserHome from './UserHome';
import ComboOffers from './ComboOffers';

type Tab = 'home' | 'movies' | 'restaurants' | 'combos' | 'bookings' | 'orders';

export default function UserDashboard() {
  const { profile, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { id: 'movies', label: 'Movies', icon: <Film size={20} /> },
    { id: 'restaurants', label: 'Restaurants', icon: <UtensilsCrossed size={20} /> },
    { id: 'combos', label: 'Combo Deals', icon: <Gift size={20} /> },
    { id: 'bookings', label: 'My Bookings', icon: <Calendar size={20} /> },
    { id: 'orders', label: 'My Orders', icon: <ShoppingBag size={20} /> },
  ];

  const renderContent = () => {
    switch (tab) {
      case 'home': return <UserHome onNavigate={setTab} />;
      case 'movies': return <MovieBrowse />;
      case 'restaurants': return <RestaurantSearch />;
      case 'combos': return <ComboOffers onBack={() => setTab('home')} />;
      case 'bookings': return <MyBookings />;
      case 'orders': return <MyOrders />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:flex lg:flex-col`}>
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
              <Film size={18} className="text-gray-950" />
            </div>
            <span className="text-xl font-bold text-white">CineEats</span>
          </div>
        </div>

        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
              <User size={18} className="text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{profile?.full_name || 'User'}</p>
              <p className="text-gray-500 text-xs truncate">{profile?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === item.id
                  ? 'bg-amber-500 text-gray-950'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
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
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-gray-900/80 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between lg:hidden">
          <button onClick={() => setMobileMenuOpen(true)} className="text-gray-400 hover:text-white">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
              <Film size={14} className="text-gray-950" />
            </div>
            <span className="text-white font-bold">CineEats</span>
          </div>
          <button className="text-gray-400 hover:text-white">
            <Bell size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
