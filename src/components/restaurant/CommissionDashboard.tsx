import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { supabase, Commission } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function CommissionDashboard() {
  const { user } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, rate: 10 });

  useEffect(() => {
    if (!user) return;
    supabase.from('restaurants').select('id, commission_rate').eq('owner_id', user.id).maybeSingle().then(({ data }) => {
      if (!data) { setLoading(false); return; }
      setRestaurantId(data.id);
      supabase.from('commissions').select('*').eq('restaurant_id', data.id).order('created_at', { ascending: false })
        .then(({ data: comms }) => {
          const list = comms || [];
          setCommissions(list);
          setStats({
            total: list.reduce((sum, c) => sum + c.commission_amount, 0),
            paid: list.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0),
            pending: list.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0),
            rate: data.commission_rate,
          });
          setLoading(false);
        });
    });
  }, [user]);

  const monthlyData = commissions.reduce((acc, c) => {
    if (!c.period_month || !c.period_year) return acc;
    const key = `${c.period_year}-${String(c.period_month).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = { month: key, total: 0, paid: 0 };
    acc[key].total += c.commission_amount;
    if (c.status === 'paid') acc[key].paid += c.commission_amount;
    return acc;
  }, {} as Record<string, { month: string; total: number; paid: number }>);

  const monthlyList = Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 6);

  const statCards = [
    { label: 'Total Commission', value: `₹${stats.total.toFixed(2)}`, icon: <TrendingUp size={20} className="text-blue-400" />, bg: 'bg-blue-500/10' },
    { label: 'Paid Out', value: `₹${stats.paid.toFixed(2)}`, icon: <CheckCircle size={20} className="text-emerald-400" />, bg: 'bg-emerald-500/10' },
    { label: 'Pending', value: `₹${stats.pending.toFixed(2)}`, icon: <Clock size={20} className="text-amber-400" />, bg: 'bg-amber-500/10' },
    { label: 'Your Rate', value: `${stats.rate}%`, icon: <DollarSign size={20} className="text-rose-400" />, bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Commission Dashboard</h1>
        <p className="text-gray-400">Track revenue share and commission reports</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {statCards.map(c => (
          <div key={c.label} className="bg-gray-900 rounded-xl p-4">
            <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center mb-3`}>{c.icon}</div>
            <p className="text-xl font-black text-white">{c.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-blue-200 text-sm">
          CineEats charges a <strong>{stats.rate}% commission</strong> on each food order placed through the platform.
          Commissions are reconciled monthly and transferred to your registered bank account.
        </p>
      </div>

      {/* Monthly breakdown */}
      {monthlyList.length > 0 && (
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <BarChart3 size={18} className="text-gray-400" /> Monthly Breakdown
          </h3>
          <div className="space-y-2">
            {monthlyList.map(m => {
              const [year, month] = m.month.split('-');
              const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
              return (
                <div key={m.month} className="flex items-center justify-between bg-gray-900 rounded-xl p-3 text-sm">
                  <span className="text-gray-300">{monthName}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-emerald-400">Paid: ₹{m.paid.toFixed(2)}</span>
                    <span className="text-amber-400">Total: ₹{m.total.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Commission list */}
      <h3 className="text-white font-semibold mb-3">Commission History</h3>
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-900 rounded-xl h-14 animate-pulse" />)}
        </div>
      ) : commissions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <TrendingUp size={32} className="mx-auto mb-2 text-gray-700" />
          <p>No commission records yet</p>
          <p className="text-sm text-gray-600 mt-1">Commissions will appear after orders are placed</p>
        </div>
      ) : (
        <div className="space-y-2">
          {commissions.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-gray-900 rounded-xl p-3 text-sm">
              <div>
                <p className="text-white font-medium">Order Commission</p>
                <p className="text-gray-500 text-xs">
                  {c.period_month && c.period_year
                    ? new Date(c.period_year, c.period_month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
                    : new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {' '}• {c.commission_rate}% rate
                </p>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">₹{c.commission_amount.toFixed(2)}</p>
                <p className={`text-xs capitalize ${c.status === 'paid' ? 'text-emerald-400' : c.status === 'disputed' ? 'text-red-400' : 'text-amber-400'}`}>
                  {c.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
