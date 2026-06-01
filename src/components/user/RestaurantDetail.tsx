import { useEffect, useState } from 'react';
import { ArrowLeft, Star, Clock, MapPin, UtensilsCrossed, ShoppingBag, Plus, Minus, X, ChevronDown, ChevronUp, Leaf, Calendar } from 'lucide-react';
import { supabase, Restaurant, MenuItem, CustomizationOption } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import TableReservation from './TableReservation';
import OrderCheckout from './OrderCheckout';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customizations: Record<string, string>;
}

interface Props {
  restaurant: Restaurant;
  onBack: () => void;
  linkedBookingId?: string;
}

export default function RestaurantDetail({ restaurant, onBack, linkedBookingId }: Props) {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [orderType, setOrderType] = useState<'dine_in' | 'pickup'>('dine_in');
  const [showCart, setShowCart] = useState(false);
  const [showReservation, setShowReservation] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [tempCustomizations, setTempCustomizations] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from('menu_items').select('*').eq('restaurant_id', restaurant.id).eq('is_available', true)
      .then(({ data }) => { setMenuItems(data || []); setLoading(false); });
  }, [restaurant.id]);

  const categories = [...new Set(menuItems.map(m => m.category))];
  const filtered = menuItems.filter(m => {
    const matchCat = !categoryFilter || m.category === categoryFilter;
    const matchVeg = !vegOnly || m.is_vegetarian;
    return matchCat && matchVeg;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (item: MenuItem) => {
    if (item.customization_options && item.customization_options.length > 0) {
      setCustomizingItem(item);
      setTempCustomizations({});
    } else {
      setCart(prev => {
        const existing = prev.find(c => c.menuItem.id === item.id);
        if (existing) return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
        return [...prev, { menuItem: item, quantity: 1, customizations: {} }];
      });
    }
  };

  const confirmCustomization = () => {
    if (!customizingItem) return;
    setCart(prev => [...prev, { menuItem: customizingItem, quantity: 1, customizations: tempCustomizations }]);
    setCustomizingItem(null);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.menuItem.id !== itemId));
  };

  const updateQty = (itemId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.menuItem.id !== itemId) return c;
      const newQty = c.quantity + delta;
      return newQty <= 0 ? null : { ...c, quantity: newQty };
    }).filter(Boolean) as CartItem[]);
  };

  if (showCheckout) {
    return (
      <OrderCheckout
        restaurant={restaurant}
        cart={cart}
        orderType={orderType}
        linkedBookingId={linkedBookingId}
        onBack={() => setShowCheckout(false)}
        onDone={onBack}
      />
    );
  }

  if (showReservation) {
    return (
      <TableReservation
        restaurant={restaurant}
        onBack={() => setShowReservation(false)}
        linkedBookingId={linkedBookingId}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="relative">
        <img
          src={restaurant.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800'}
          alt={restaurant.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-9 h-9 bg-gray-950/70 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-gray-950"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-white text-2xl font-black">{restaurant.name}</h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-300">
            <span className="flex items-center gap-1"><Star size={12} className="text-amber-400 fill-amber-400" />{restaurant.rating}</span>
            <span className="flex items-center gap-1"><MapPin size={12} />{restaurant.city}</span>
            <span className="flex items-center gap-1"><Clock size={12} />{restaurant.delivery_time_minutes} min</span>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Order type + actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex bg-gray-900 rounded-xl p-1 flex-1">
            {(['dine_in', 'pickup'] as const).map(type => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                  orderType === type ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {type === 'dine_in' ? <UtensilsCrossed size={15} /> : <ShoppingBag size={15} />}
                {type === 'dine_in' ? 'Dine-In' : 'Pickup'}
              </button>
            ))}
          </div>
          {orderType === 'dine_in' && (
            <button
              onClick={() => setShowReservation(true)}
              className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all"
            >
              <Calendar size={15} /> Reserve Table
            </button>
          )}
        </div>

        {/* Category + veg filters */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              vegOnly ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-700 text-gray-400'
            }`}
          >
            <Leaf size={12} /> Veg Only
          </button>
          <button
            onClick={() => setCategoryFilter('')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              !categoryFilter ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            All
          </button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                categoryFilter === c ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Menu items */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-900 rounded-xl h-20 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <UtensilsCrossed size={32} className="mx-auto mb-2 text-gray-700" />
            <p>{menuItems.length === 0 ? 'Menu coming soon' : 'No items match your filters'}</p>
          </div>
        ) : (
          <div className="space-y-3 pb-28">
            {filtered.map(item => {
              const inCart = cart.find(c => c.menuItem.id === item.id);
              return (
                <div key={item.id} className="flex items-center gap-3 bg-gray-900 rounded-xl p-3">
                  <img
                    src={item.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200'}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {item.is_vegetarian && (
                        <div className="w-4 h-4 border border-emerald-500 rounded flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        </div>
                      )}
                      <p className="text-white font-medium text-sm truncate">{item.name}</p>
                    </div>
                    <p className="text-gray-500 text-xs truncate">{item.description}</p>
                    <p className="text-amber-400 font-semibold text-sm mt-1">₹{item.price}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {inCart ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-white transition-colors">
                          <Minus size={12} />
                        </button>
                        <span className="text-white font-semibold w-5 text-center text-sm">{inCart.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center justify-center text-white transition-colors">
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1"
                      >
                        <Plus size={14} /> Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-950/95 backdrop-blur border-t border-gray-800 z-30">
          <button
            onClick={() => setShowCheckout(true)}
            className="w-full max-w-3xl mx-auto flex items-center justify-between bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3.5 rounded-xl transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm">{cartCount}</span>
              <span>View Cart</span>
            </div>
            <span>₹{cartTotal}</span>
          </button>
        </div>
      )}

      {/* Customization Modal */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-bold">Customize {customizingItem.name}</h3>
              <button onClick={() => setCustomizingItem(null)} className="text-gray-500 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {customizingItem.customization_options?.map((opt: CustomizationOption) => (
                <div key={opt.name}>
                  <p className="text-white font-medium text-sm mb-2">
                    {opt.name} {opt.required && <span className="text-red-400 text-xs">*Required</span>}
                  </p>
                  <div className="space-y-1.5">
                    {opt.choices.map(choice => (
                      <button
                        key={choice}
                        onClick={() => setTempCustomizations(prev => ({ ...prev, [opt.name]: choice }))}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-all ${
                          tempCustomizations[opt.name] === choice
                            ? 'border-emerald-500 bg-emerald-500/10 text-white'
                            : 'border-gray-700 text-gray-400'
                        }`}
                      >
                        {choice}
                        {tempCustomizations[opt.name] === choice && <div className="w-4 h-4 bg-emerald-500 rounded-full" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 pt-0">
              <button
                onClick={confirmCustomization}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all"
              >
                Add to Cart — ₹{customizingItem.price}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
