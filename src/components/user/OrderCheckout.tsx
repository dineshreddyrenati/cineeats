import { useState } from 'react';
import { ArrowLeft, CheckCircle, Info, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { supabase, Restaurant, MenuItem } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customizations: Record<string, string>;
}

interface Props {
  restaurant: Restaurant;
  cart: CartItem[];
  orderType: 'dine_in' | 'pickup';
  linkedBookingId?: string;
  onBack: () => void;
  onDone: () => void;
}

export default function OrderCheckout({ restaurant, cart, orderType, linkedBookingId, onBack, onDone }: Props) {
  const { user } = useAuth();
  const [instructions, setInstructions] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderRef, setOrderRef] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + taxes;
  const advancePaid = Math.ceil(total * 0.75);
  const balanceDue = total - advancePaid;

  const placeOrder = async () => {
    if (!user) return;
    setPlacing(true);

    const { data: order, error } = await supabase
      .from('food_orders')
      .insert({
        user_id: user.id,
        restaurant_id: restaurant.id,
        order_type: orderType,
        total_amount: total,
        advance_paid: advancePaid,
        balance_due: balanceDue,
        payment_status: 'advance_paid',
        order_status: 'placed',
        special_instructions: instructions,
        linked_booking_id: linkedBookingId || null,
        estimated_ready_time: new Date(Date.now() + restaurant.delivery_time_minutes * 60000).toISOString(),
      })
      .select()
      .single();

    if (error || !order) { setPlacing(false); return; }

    await supabase.from('food_order_items').insert(
      cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        unit_price: item.menuItem.price,
        customizations: item.customizations,
        subtotal: item.menuItem.price * item.quantity,
      }))
    );

    // Record commission
    const commissionAmount = (total * restaurant.commission_rate) / 100;
    await supabase.from('commissions').insert({
      restaurant_id: restaurant.id,
      food_order_id: order.id,
      commission_amount: commissionAmount,
      commission_rate: restaurant.commission_rate,
      order_total: total,
      period_month: new Date().getMonth() + 1,
      period_year: new Date().getFullYear(),
    });

    setOrderRef(order.order_reference);
    setPlacing(false);
  };

  if (orderRef) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={36} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Order Placed!</h2>
          <p className="text-gray-400 text-sm">Your food is being prepared</p>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Order Reference</span>
            <span className="text-white font-mono font-bold">{orderRef}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Restaurant</span>
            <span className="text-white">{restaurant.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Order Type</span>
            <span className="text-white capitalize">{orderType.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Est. Ready in</span>
            <span className="text-amber-400">{restaurant.delivery_time_minutes} min</span>
          </div>
          <div className="flex justify-between text-emerald-400 font-semibold pt-2 border-t border-gray-800">
            <span>Paid Now (75%)</span>
            <span>₹{advancePaid}</span>
          </div>
          <div className="flex justify-between text-amber-400">
            <span>Pay on {orderType === 'dine_in' ? 'Arrival' : 'Pickup'} (25%)</span>
            <span>₹{balanceDue}</span>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mb-5">Track live order status in "My Orders"</p>

        <button onClick={onDone} className="w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-3.5 rounded-xl">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-5 transition-colors text-sm">
        <ArrowLeft size={16} /> Back to Menu
      </button>

      <h2 className="text-xl font-bold text-white mb-1">Order Summary</h2>
      <div className="flex items-center gap-2 mb-5">
        {orderType === 'dine_in' ? (
          <span className="flex items-center gap-1 text-emerald-400 text-sm"><UtensilsCrossed size={14} /> Dine-In at {restaurant.name}</span>
        ) : (
          <span className="flex items-center gap-1 text-amber-400 text-sm"><ShoppingBag size={14} /> Pickup from {restaurant.name}</span>
        )}
      </div>

      {/* Cart items */}
      <div className="bg-gray-900 rounded-xl divide-y divide-gray-800 mb-4">
        {cart.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-gray-400 w-5 text-right flex-shrink-0">{item.quantity}x</span>
              <div className="min-w-0">
                <p className="text-white truncate">{item.menuItem.name}</p>
                {Object.keys(item.customizations).length > 0 && (
                  <p className="text-gray-500 text-xs">{Object.values(item.customizations).join(', ')}</p>
                )}
              </div>
            </div>
            <span className="text-white font-medium flex-shrink-0 ml-2">₹{item.menuItem.price * item.quantity}</span>
          </div>
        ))}
      </div>

      {/* Special instructions */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">Special Instructions (optional)</label>
        <textarea
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          placeholder="No onions, extra spicy, separate packaging..."
          rows={2}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 text-sm resize-none"
        />
      </div>

      {/* Price breakdown */}
      <div className="bg-gray-900 rounded-xl p-4 mb-4 text-sm space-y-2">
        <div className="flex justify-between text-gray-400">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>GST (5%)</span>
          <span>₹{taxes}</span>
        </div>
        <div className="flex justify-between text-white font-semibold border-t border-gray-800 pt-2">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
      </div>

      {/* Advance info */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-5 flex items-start gap-2 text-sm">
        <Info size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="text-amber-200">
          <p className="font-semibold">75% advance payment required</p>
          <p className="text-amber-300/70 text-xs mt-0.5">
            Pay ₹{advancePaid} now. Remaining ₹{balanceDue} on {orderType === 'dine_in' ? 'arrival' : 'pickup'}.
          </p>
        </div>
      </div>

      <button
        onClick={placeOrder}
        disabled={placing}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {placing ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          `Confirm & Pay ₹${advancePaid}`
        )}
      </button>
    </div>
  );
}
