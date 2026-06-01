import { Film, UtensilsCrossed, Gift, ArrowRight, Star, Clock, MapPin, Zap, Ticket, ChefHat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type Tab = 'home' | 'movies' | 'restaurants' | 'combos' | 'bookings' | 'orders';

interface Props {
  onNavigate: (tab: Tab) => void;
}

export default function UserHome({ onNavigate }: Props) {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Split Hero Section */}
      <div className="grid md:grid-cols-2">
        {/* Theater Booking Side */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img
            src="https://images.pexels.com/photos/7991486/pexels-photo-7991486.jpeg?auto=compress&cs=tinysrgb&w=800"
            alt="Cinema"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              <Ticket size={20} className="text-amber-400" />
              <span className="text-amber-400 font-semibold text-sm">THEATER BOOKING</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Book Your Seats</h2>
            <p className="text-gray-300 text-sm mb-4">Select seats, pay securely, get instant QR tickets</p>
            <button
              onClick={() => onNavigate('movies')}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-5 py-2.5 rounded-xl transition-all"
            >
              Browse Movies <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Food Pre-Order Side */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img
            src="https://images.pexels.com/photos/4958790/pexels-photo-4958790.jpeg?auto=compress&cs=tinysrgb&w=800"
            alt="Restaurant"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              <ChefHat size={20} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold text-sm">FOOD PRE-ORDER</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Pre-Order Dining</h2>
            <p className="text-gray-300 text-sm mb-4">Reserve tables or order pickup from top restaurants</p>
            <button
              onClick={() => onNavigate('restaurants')}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold px-5 py-2.5 rounded-xl transition-all"
            >
              Browse Restaurants <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {/* Greeting */}
        <div className="mb-6">
          <p className="text-gray-400 text-sm">Welcome back,</p>
          <h1 className="text-2xl font-bold text-white">{profile?.full_name || 'Movie Lover'}!</h1>
        </div>

        {/* Combo Deals Banner */}
        <button
          onClick={() => onNavigate('combos')}
          className="w-full relative rounded-2xl overflow-hidden mb-6 group"
        >
          <img
            src="https://images.pexels.com/photos/3184192/pexels-photo-3184192.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="Combo Deals"
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-rose-600/90 via-rose-600/70 to-transparent flex items-center p-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Gift size={18} className="text-white" />
                <span className="text-white/90 font-semibold text-xs uppercase tracking-wider">Exclusive Deals</span>
              </div>
              <h3 className="text-xl font-black text-white mb-1">Theater + Restaurant Combos</h3>
              <p className="text-white/80 text-sm">Save up to 30% with our partner bundles</p>
            </div>
          </div>
        </button>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => onNavigate('bookings')}
            className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl p-4 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <Ticket size={20} className="text-amber-400" />
              <ArrowRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
            </div>
            <p className="text-white font-semibold text-sm">My Bookings</p>
            <p className="text-gray-500 text-xs mt-0.5">View tickets & QR codes</p>
          </button>
          <button
            onClick={() => onNavigate('orders')}
            className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl p-4 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <UtensilsCrossed size={20} className="text-emerald-400" />
              <ArrowRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
            </div>
            <p className="text-white font-semibold text-sm">My Orders</p>
            <p className="text-gray-500 text-xs mt-0.5">Track live order status</p>
          </button>
        </div>

        {/* Why CineEats */}
        <div className="bg-gray-900 rounded-2xl p-5">
          <h3 className="text-white font-bold mb-4">Why CineEats?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Zap size={18} className="text-amber-400" />, text: 'Instant QR Tickets' },
              { icon: <Star size={18} className="text-emerald-400" />, text: 'Top Restaurants' },
              { icon: <Clock size={18} className="text-blue-400" />, text: 'Live Tracking' },
              { icon: <MapPin size={18} className="text-rose-400" />, text: 'Nearby Partners' },
            ].map(h => (
              <div key={h.text} className="flex items-center gap-2.5 text-gray-300 text-sm">
                {h.icon}
                {h.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
