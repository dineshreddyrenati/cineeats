import { useEffect, useState } from 'react';
import { UtensilsCrossed, ShoppingBag, Clock, CheckCircle, XCircle, ChefHat, Package, RefreshCw } from 'lucide-react';
import { supabase, FoodOrder } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const statusSteps = ['placed', 'confirmed', 'preparing', 'ready', 'delivered'];

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  placed: { icon: <Clock size={14} />, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Order Placed' },
  confirmed: { icon: <CheckCircle size={14} />, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Confirmed' },
  preparing: { icon: <ChefHat size={14} />, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Preparing' },
  ready: { icon: <Package size={14} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Ready' },
  delivered: { icon: <CheckCircle size={14} />, color: 'text-gray-400', bg: 'bg-gray-700', label: 'Delivered' },
  cancelled: { icon: <XCircle size={14} />, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Cancelled' },
};

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('food_orders')
      .select('*, restaurant:restaurants(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
  };

  useEffect(() => {
    loadOrders().finally(() => setLoading(false));
  }, [user]);

  const refresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.order_status));
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.order_status));

  const OrderCard = ({ order }: { order: FoodOrder }) => {
    const rest = order.restaurant as any;
    const status = statusConfig[order.order_status] || statusConfig.placed;
    const stepIdx = statusSteps.indexOf(order.order_status);
    const isExpanded = expandedId === order.id;
    const isActive = !['delivered', 'cancelled'].includes(order.order_status);

    return (
      <div className="bg-gray-900 rounded-xl overflow-hidden">
        <button
          onClick={() => setExpandedId(isExpanded ? null : order.id)}
          className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${order.order_type === 'dine_in' ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
            {order.order_type === 'dine_in'
              ? <UtensilsCrossed size={18} className="text-emerald-400" />
              : <ShoppingBag size={18} className="text-amber-400" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold truncate">{rest?.name}</p>
            <div className="flex items-center gap-3 text-gray-500 text-xs mt-0.5">
              <span className="capitalize">{order.order_type.replace('_', ' ')}</span>
              <span className="font-mono">{order.order_reference}</span>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${status.color} ${status.bg}`}>
              {status.icon} {status.label}
            </span>
            <p className="text-gray-400 text-xs mt-1">₹{order.total_amount}</p>
          </div>
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-800 pt-4">
            {/* Progress bar for active orders */}
            {isActive && order.order_status !== 'cancelled' && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  {statusSteps.map((step, idx) => (
                    <div key={step} className="flex items-center flex-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${idx <= stepIdx ? 'bg-amber-500' : 'bg-gray-700'}`} />
                      {idx < statusSteps.length - 1 && (
                        <div className={`flex-1 h-0.5 ${idx < stepIdx ? 'bg-amber-500' : 'bg-gray-700'}`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Placed</span>
                  <span>Confirmed</span>
                  <span>Preparing</span>
                  <span>Ready</span>
                  <span>Done</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Total Amount</p>
                <p className="text-white">₹{order.total_amount}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Paid Online</p>
                <p className="text-emerald-400 font-semibold">₹{order.advance_paid}</p>
              </div>
              {order.balance_due > 0 && (
                <div>
                  <p className="text-gray-500 text-xs">Pay on {order.order_type === 'dine_in' ? 'Arrival' : 'Pickup'}</p>
                  <p className="text-amber-400">₹{order.balance_due}</p>
                </div>
              )}
              {order.estimated_ready_time && isActive && (
                <div>
                  <p className="text-gray-500 text-xs">Est. Ready Time</p>
                  <p className="text-white">
                    {new Date(order.estimated_ready_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>

            {order.special_instructions && (
              <div className="mt-3 text-sm">
                <p className="text-gray-500 text-xs">Special Instructions</p>
                <p className="text-gray-300 mt-0.5">{order.special_instructions}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Orders</h1>
          <p className="text-gray-400">Live order tracking & history</p>
        </div>
        <button
          onClick={refresh}
          className={`flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors ${refreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-900 rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <UtensilsCrossed size={40} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No orders yet</p>
          <p className="text-gray-600 text-sm mt-1">Order food from partner restaurants</p>
        </div>
      ) : (
        <>
          {activeOrders.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Active Orders
              </h3>
              <div className="space-y-3">
                {activeOrders.map(o => <OrderCard key={o.id} order={o} />)}
              </div>
            </div>
          )}
          {pastOrders.length > 0 && (
            <div>
              <h3 className="text-gray-400 font-semibold mb-3">Past Orders</h3>
              <div className="space-y-3">
                {pastOrders.map(o => <OrderCard key={o.id} order={o} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
