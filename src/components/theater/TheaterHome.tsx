import { useEffect, useState } from 'react';
import { Calendar, QrCode, Gift, Building2, TrendingUp, Users, Film, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

type Tab = 'home' | 'shows' | 'qr' | 'combos' | 'setup';

interface Props {
  onNavigate: (tab: Tab) => void;
}

export default function TheaterHome({ onNavigate }: Props) {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ totalShows: 0, totalBookings: 0, totalRevenue: 0, theaters: 0 });
  const [hasTheater, setHasTheater] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: theaters } = await supabase.from('theaters').select('id').eq('owner_id', user.id);
      const theatersData = theaters || [];
      setHasTheater(theatersData.length > 0);

      if (theatersData.length === 0) return;
      const theaterIds = theatersData.map(t => t.id);

      const { data: shows } = await supabase.from('shows').select('id').in('theater_id', theaterIds);
      const showIds = (shows || []).map(s => s.id);

      let bookings: any[] = [];
      if (showIds.length > 0) {
        const { data: b } = await supabase.from('bookings').select('advance_paid').in('show_id', showIds);
        bookings = b || [];
      }

      setStats({
        theaters: theatersData.length,
        totalShows: (shows || []).length,
        totalBookings: bookings.length,
        totalRevenue: bookings.reduce((sum, b) => sum + (b.advance_paid || 0), 0),
      });
    })();
  }, [user]);

  const cards = [
    { label: 'Theaters', value: stats.theaters, icon: <Building2 size={20} className="text-blue-400" />, bg: 'bg-blue-500/10' },
    { label: 'Active Shows', value: stats.totalShows, icon: <Film size={20} className="text-amber-400" />, bg: 'bg-amber-500/10' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: <Users size={20} className="text-emerald-400" />, bg: 'bg-emerald-500/10' },
    { label: 'Revenue (₹)', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: <TrendingUp size={20} className="text-rose-400" />, bg: 'bg-rose-500/10' },
  ];

  const actions: { id: Tab; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    { id: 'shows', label: 'Manage Shows', desc: 'Add and schedule movie shows', icon: <Calendar size={22} />, color: 'text-blue-400' },
    { id: 'qr', label: 'Verify Tickets', desc: 'Scan & validate QR codes', icon: <QrCode size={22} />, color: 'text-emerald-400' },
    { id: 'combos', label: 'Combo Deals', desc: 'Partner with restaurants', icon: <Gift size={22} />, color: 'text-amber-400' },
    { id: 'setup', label: 'Theater Profile', desc: 'Update theater details', icon: <Building2 size={22} />, color: 'text-gray-400' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Welcome, {profile?.full_name?.split(' ')[0]}</h1>
        <p className="text-gray-400 mt-1">Theater Partner Dashboard</p>
      </div>

      {!hasTheater && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-blue-400 font-semibold">Set up your theater to get started</p>
            <p className="text-gray-400 text-sm mt-0.5">Add your theater details before scheduling shows</p>
          </div>
          <button
            onClick={() => onNavigate('setup')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all"
          >
            Setup <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-gray-900 rounded-xl p-4">
            <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center mb-3`}>
              {c.icon}
            </div>
            <p className="text-2xl font-black text-white">{c.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h3 className="text-white font-semibold mb-3">Quick Actions</h3>
      <div className="grid md:grid-cols-2 gap-3">
        {actions.map(a => (
          <button
            key={a.id}
            onClick={() => onNavigate(a.id)}
            className="flex items-center gap-4 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl p-4 text-left transition-all group"
          >
            <div className={`${a.color} bg-gray-800 rounded-xl p-2.5`}>{a.icon}</div>
            <div className="flex-1">
              <p className="text-white font-semibold">{a.label}</p>
              <p className="text-gray-500 text-sm">{a.desc}</p>
            </div>
            <ArrowRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
