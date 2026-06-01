import { useEffect, useState } from 'react';
import { RefreshCw, ChefHat, Package, CheckCircle, XCircle, Clock, UtensilsCrossed, ShoppingBag } from 'lucide-react';
import { supabase, FoodOrder } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const ORDER_STATUSES = ['placed', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] as const;
type OrderStatus = typeof ORDER_STATUSES[number];

const statusConfig: Record<OrderStatus, { label: string; color: string; next?: OrderStatus }> = {
  placed: { label: 'Placed', color: 'text-amber-400', next: 'confirmed' },
  confirmed: { label: 'Confirmed', color: 'text-blue-400', next: 'preparing' },
  preparing: { label: 'Preparing', color: 'text-orange-400', next: 'ready' },
  ready: { label: 'Ready', color: 'text-emerald-400', next: 'delivered' },
  delivered: { label: 'Delivered', color: 'text-gray-400' },
  cancelled: { label: 'Cancelled', color: 'text-red-400' },
};

export default function OrderManager() {
  const { user } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('restaurants').select('id').eq('owner_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setRestaurantId(data.id);
        loadOrders(data.id);
      } else {
        setLoading(false);
      }
    });
  }, [user]);

  const loadOrders = async (restId: string) => {
    const { data } = await supabase
      .from('food_orders')
      .select('*')
      .eq('restaurant_id', restId)
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const refresh = async () => {
    if (!restaurantId) return;
    setRefreshing(true);
    await loadOrders(restaurantId);
    setRefreshing(false);
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setUpdating(orderId);
    await supabase.from('food_orders').update({ order_status: status }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: status } : o));
    setUpdating(null);
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.order_status === filter);
  const activeCount = orders.filter(o => !['delivered', 'cancelled'].includes(o.order_status)).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Orders</h1>
          <p className="text-gray-400">
            {activeCount > 0 ? (
              <span className="text-amber-400 font-medium">{activeCount} active order{activeCount !== 1 ? 's' : ''}</span>
            ) : 'No active orders'}
          </p>
        </div>
        <button
          onClick={refresh}
          className={`text-gray-400 hover:text-white transition-colors ${refreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        <button
          onClick={() => setFilter('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-gray-400'
          }`}
        >
          All ({orders.length})
        </button>
        {(['placed', 'confirmed', 'preparing', 'ready'] as OrderStatus[]).map(s => {
          const count = orders.filter(o => o.order_status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                filter === s ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-gray-400'
              }`}
            >
              {s} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-900 rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <ShoppingBag size={40} className="mx-auto mb-3 text-gray-700" />
          <p>No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const cfg = statusConfig[order.order_status as OrderStatus] || statusConfig.placed;
            const nextStatus = cfg.next;
            const isActive = !['delivered', 'cancelled'].includes(order.order_status);

            return (
              <div key={order.id} className={`bg-gray-900 rounded-xl p-4 ${isActive ? 'border border-gray-700' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${order.order_type === 'dine_in' ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                      {order.order_type === 'dine_in'
                        ? <UtensilsCrossed size={18} className="text-emerald-400" />
                        : <ShoppingBag size={18} className="text-amber-400" />
                      }
                    </div>
                    <div>
                      <p className="text-white font-semibold font-mono text-sm">{order.order_reference}</p>
                      <p className="text-gray-500 text-xs capitalize">{order.order_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold capitalize ${cfg.color}`}>{cfg.label}</p>
                    <p className="text-gray-400 text-sm">₹{order.total_amount}</p>
                  </div>
                </div>

                {order.special_instructions && (
                  <p className="text-gray-400 text-xs bg-gray-800 rounded-lg px-3 py-2 mb-3">
                    Note: {order.special_instructions}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="flex gap-2">
                    {isActive && (
                      <button
                        onClick={() => updateStatus(order.id, 'cancelled')}
                        disabled={!!updating}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-medium transition-all"
                      >
                        Cancel
                      </button>
                    )}
                    {nextStatus && (
                      <button
                        onClick={() => updateStatus(order.id, nextStatus)}
                        disabled={!!updating}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-all flex items-center gap-1.5"
                      >
                        {updating === order.id ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
