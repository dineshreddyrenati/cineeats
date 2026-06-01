import { useEffect, useState } from 'react';
import { ShoppingBag, BookOpen, Calendar, TrendingUp, Settings, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

type Tab = 'home' | 'menu' | 'orders' | 'reservations' | 'commissions' | 'setup';

interface Props {
  onNavigate: (tab: Tab) => void;
}

export default function RestaurantHome({ onNavigate }: Props) {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ pendingOrders: 0, todayRevenue: 0, menuItems: 0, reservations: 0 });
  const [hasRestaurant, setHasRestaurant] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: rest } = await supabase.from('restaurants').select('id').eq('owner_id', user.id).maybeSingle();
      if (!rest) return;
      setHasRestaurant(true);

      const today = new Date().toISOString().split('T')[0];

      const [ordersRes, menuRes, resRes] = await Promise.all([
        supabase.from('food_orders').select('*').eq('restaurant_id', rest.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('menu_items').select('id').eq('restaurant_id', rest.id),
        supabase.from('table_reservations').select('id').eq('restaurant_id', rest.id).eq('reservation_date', today),
      ]);

      const orders = ordersRes.data || [];
      const pending = orders.filter(o => ['placed', 'confirmed', 'preparing'].includes(o.order_status)).length;
      const todayOrders = orders.filter(o => o.created_at?.startsWith(today));
      const todayRev = todayOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

      setStats({
        pendingOrders: pending,
        todayRevenue: todayRev,
        menuItems: (menuRes.data || []).length,
        reservations: (resRes.data || []).length,
      });
      setRecentOrders(orders.slice(0, 3));
    })();
  }, [user]);

  const statusColors: Record<string, string> = {
    placed: 'text-amber-400',
    confirmed: 'text-blue-400',
    preparing: 'text-orange-400',
    ready: 'text-emerald-400',
    delivered: 'text-gray-400',
    cancelled: 'text-red-400',
  };

  const cards = [
    { label: 'Pending Orders', value: stats.pendingOrders, icon: <Clock size={20} className="text-amber-400" />, bg: 'bg-amber-500/10' },
    { label: "Today's Revenue", value: `₹${stats.todayRevenue.toLocaleString('en-IN')}`, icon: <TrendingUp size={20} className="text-emerald-400" />, bg: 'bg-emerald-500/10' },
    { label: 'Menu Items', value: stats.menuItems, icon: <BookOpen size={20} className="text-blue-400" />, bg: 'bg-blue-500/10' },
    { label: 'Reservations Today', value: stats.reservations, icon: <Calendar size={20} className="text-rose-400" />, bg: 'bg-rose-500/10' },
  ];

  const actions: { id: Tab; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'orders', label: 'Manage Orders', desc: 'View and update order statuses', icon: <ShoppingBag size={22} /> },
    { id: 'menu', label: 'Menu Manager', desc: 'Add items, set prices & customize', icon: <BookOpen size={22} /> },
    { id: 'reservations', label: 'Reservations', desc: 'Manage table bookings', icon: <Calendar size={22} /> },
    { id: 'commissions', label: 'Commissions', desc: 'View revenue & commission reports', icon: <TrendingUp size={22} /> },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Welcome, {profile?.full_name?.split(' ')[0]}</h1>
        <p className="text-gray-400 mt-1">Restaurant Partner Dashboard</p>
      </div>

      {!hasRestaurant && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-emerald-400 font-semibold">Set up your restaurant to get started</p>
            <p className="text-gray-400 text-sm mt-0.5">Add your restaurant details to appear in customer search</p>
          </div>
          <button
            onClick={() => onNavigate('setup')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all"
          >
            Setup <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-gray-900 rounded-xl p-4">
            <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center mb-3`}>{c.icon}</div>
            <p className="text-2xl font-black text-white">{c.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">Recent Orders</h3>
            <button onClick={() => onNavigate('orders')} className="text-emerald-400 text-sm hover:text-emerald-300 flex items-center gap-1">
              View all <ArrowRight size={13} />
            </button>
          </div>
          <div className="space-y-2">
            {recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between bg-gray-900 rounded-xl p-3 text-sm">
                <div>
                  <p className="text-white font-medium font-mono">{order.order_reference}</p>
                  <p className="text-gray-500 text-xs capitalize">{order.order_type.replace('_', ' ')}</p>
                </div>
                <div className="text-right">
                  <p className={`font-medium capitalize ${statusColors[order.order_status] || 'text-gray-400'}`}>
                    {order.order_status}
                  </p>
                  <p className="text-gray-400 text-xs">₹{order.total_amount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <h3 className="text-white font-semibold mb-3">Quick Actions</h3>
      <div className="grid md:grid-cols-2 gap-3">
        {actions.map(a => (
          <button
            key={a.id}
            onClick={() => onNavigate(a.id)}
            className="flex items-center gap-4 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl p-4 text-left transition-all group"
          >
            <div className="text-emerald-400 bg-gray-800 rounded-xl p-2.5">{a.icon}</div>
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
