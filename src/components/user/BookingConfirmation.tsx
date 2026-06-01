import { CheckCircle, Download, UtensilsCrossed, ArrowRight, MapPin, Gift } from 'lucide-react';
import { Show, Movie, Seat, ComboDeal } from '../../lib/supabase';

interface Props {
  bookingRef: string;
  qrCode: string;
  show: Show;
  movie: Movie;
  seats: Seat[];
  totalAmount: number;
  advancePaid: number;
  combos: ComboDeal[];
  onDone: () => void;
}

function QRCodeDisplay({ data }: { data: string }) {
  // Simple visual QR representation using the data string
  const hash = data.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const size = 8;
  const grid = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => ((hash * (i + 1) * (j + 1)) % 3) !== 0)
  );

  return (
    <div className="bg-white p-3 rounded-xl inline-block">
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {grid.flat().map((filled, idx) => (
          <div key={idx} className={`w-5 h-5 ${filled ? 'bg-gray-950' : 'bg-white'}`} />
        ))}
      </div>
      <p className="text-center text-gray-500 text-xs mt-2 font-mono">{data.slice(-8)}</p>
    </div>
  );
}

export default function BookingConfirmation({ bookingRef, qrCode, show, movie, seats, totalAmount, advancePaid, combos, onDone }: Props) {
  const balanceDue = totalAmount - advancePaid;

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      {/* Success header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={36} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Booking Confirmed!</h2>
        <p className="text-gray-400 text-sm">Your seats are reserved. Enjoy the show!</p>
      </div>

      {/* Ticket card */}
      <div className="bg-gray-900 rounded-2xl overflow-hidden mb-5">
        {/* Ticket top */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-950 text-xs font-semibold uppercase tracking-wider">Movie Ticket</p>
              <h3 className="text-gray-950 font-black text-lg">{movie.title}</h3>
            </div>
            <div className="text-right">
              <p className="text-amber-900 text-xs">Ref:</p>
              <p className="text-gray-950 font-mono font-bold text-sm">{bookingRef}</p>
            </div>
          </div>
        </div>

        {/* Dashed divider */}
        <div className="flex items-center px-4 py-2">
          <div className="flex-1 border-t border-dashed border-gray-700" />
          <div className="w-4 h-4 bg-gray-950 rounded-full mx-2 -my-1" />
          <div className="flex-1 border-t border-dashed border-gray-700" />
        </div>

        {/* Ticket details */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Theater</p>
            <p className="text-white font-medium">{show.theater?.name}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Screen</p>
            <p className="text-white font-medium">Screen {show.screen_number}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Date</p>
            <p className="text-white font-medium">
              {new Date(show.show_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Time</p>
            <p className="text-white font-medium">{show.show_time.slice(0, 5)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Seats</p>
            <p className="text-white font-medium">{seats.map(s => s.seat_number).join(', ')}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Status</p>
            <p className="text-emerald-400 font-medium">Confirmed</p>
          </div>
        </div>

        {/* Dashed divider */}
        <div className="flex items-center px-4 py-2">
          <div className="flex-1 border-t border-dashed border-gray-700" />
          <div className="w-4 h-4 bg-gray-950 rounded-full mx-2 -my-1" />
          <div className="flex-1 border-t border-dashed border-gray-700" />
        </div>

        {/* QR Code */}
        <div className="px-4 pb-4 flex flex-col items-center">
          <QRCodeDisplay data={qrCode} />
          <p className="text-gray-500 text-xs mt-2 text-center">Show this QR at the theater entrance</p>
        </div>

        {/* Payment summary */}
        <div className="mx-4 mb-4 bg-gray-800 rounded-xl p-3 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>Total Amount</span>
            <span>₹{totalAmount}</span>
          </div>
          <div className="flex justify-between text-emerald-400 font-semibold mt-1">
            <span>Paid Now (75%)</span>
            <span>₹{advancePaid}</span>
          </div>
          <div className="flex justify-between text-amber-400 mt-1">
            <span>Pay at Theater (25%)</span>
            <span>₹{balanceDue}</span>
          </div>
        </div>
      </div>

      {/* Combo deals CTA */}
      {combos.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={18} className="text-amber-400" />
            <h4 className="text-white font-semibold">Enhance Your Evening!</h4>
          </div>
          <p className="text-gray-300 text-sm mb-3">
            You've unlocked combo dining deals with your booking!
          </p>
          {combos.slice(0, 2).map(combo => (
            <div key={combo.id} className="flex items-center justify-between bg-gray-900 rounded-xl p-3 mb-2 text-sm">
              <div>
                <p className="text-white font-medium">{combo.restaurant?.name}</p>
                <p className="text-amber-400 text-xs">{combo.discount_percentage}% discount on dining</p>
              </div>
              <ArrowRight size={16} className="text-gray-500" />
            </div>
          ))}
        </div>
      )}

      {/* Nearby restaurants CTA */}
      <div className="bg-gray-900 rounded-2xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={18} className="text-emerald-400" />
          <h4 className="text-white font-semibold">Restaurants Nearby</h4>
        </div>
        <p className="text-gray-400 text-sm mb-3">
          Pre-order food or reserve a table at restaurants near {show.theater?.name}
        </p>
        <button
          onClick={onDone}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
        >
          <UtensilsCrossed size={16} /> Browse Nearby Restaurants
        </button>
      </div>

      <button
        onClick={onDone}
        className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-semibold py-3 rounded-xl transition-all"
      >
        Done
      </button>
    </div>
  );
}
