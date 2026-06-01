import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Info, Gift } from 'lucide-react';
import { supabase, Seat, Show, Movie, ComboDeal } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import PaymentProcessing from './PaymentProcessing';
import BookingConfirmation from './BookingConfirmation';

interface Props {
  show: Show;
  movie: Movie;
  onBack: () => void;
}

export default function SeatSelector({ show, movie, onBack }: Props) {
  const { user } = useAuth();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [combos, setCombos] = useState<ComboDeal[]>([]);
  const [selectedCombo, setSelectedCombo] = useState<ComboDeal | null>(null);

  // Payment flow states
  const [stage, setStage] = useState<'seats' | 'payment' | 'confirmation'>('seats');
  const [bookingResult, setBookingResult] = useState<{ reference: string; qr: string; paymentId: string } | null>(null);

  useEffect(() => {
    loadSeats();
    loadCombos();
  }, [show.id]);

  const loadSeats = async () => {
    const { data }: any = await supabase.from('seats').select('*').eq('show_id', show.id).order('row_label').order('seat_number');
    if (data && data.length > 0) {
      setSeats(data);
    } else {
      const generated = [];
      const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      for (const row of rows) {
        for (let n = 1; n <= 10; n++) {
          generated.push({
            show_id: show.id,
            seat_number: `${row}${n}`,
            row_label: row,
            seat_type: ['G', 'H'].includes(row) ? 'premium' : 'regular',
            is_booked: Math.random() < 0.25,
          });
        }
      }
      const { data: inserted }: any = await supabase.from('seats').insert(generated).select();
      setSeats(inserted || []);
    }
    setLoading(false);
  };

  const loadCombos = async () => {
    const { data } = await supabase
      .from('combo_deals')
      .select('*, theater:theaters(*), restaurant:restaurants(*)')
      .eq('theater_id', show.theater_id)
      .eq('is_active', true)
      .eq('theater_approved', true)
      .eq('restaurant_approved', true);
    setCombos(data || []);
  };

  const toggleSeat = (seat: Seat) => {
    if (seat.is_booked) return;
    setSelected(prev => {
      const exists = prev.find(s => s.id === seat.id);
      if (exists) return prev.filter(s => s.id !== seat.id);
      if (prev.length >= 10) return prev;
      return [...prev, seat];
    });
  };

  const regularSeats = selected.filter(s => s.seat_type === 'regular').length;
  const premiumSeats = selected.filter(s => s.seat_type === 'premium').length;
  const totalAmount = regularSeats * show.price_regular + premiumSeats * show.price_premium;

  // Apply combo discount
  const discountAmount = selectedCombo ? (totalAmount * selectedCombo.discount_percentage) / 100 : 0;
  const discountedTotal = totalAmount - discountAmount;
  const advancePaid = Math.ceil(discountedTotal * 0.75);
  const balanceDue = discountedTotal - advancePaid;

  const handleProceedToPayment = () => {
    if (selected.length === 0) return;
    setStage('payment');
  };

  const handlePaymentComplete = (reference: string, qr: string, paymentId: string) => {
    setBookingResult({ reference, qr, paymentId });
    setStage('confirmation');
  };

  if (stage === 'confirmation' && bookingResult) {
    return (
      <BookingConfirmation
        bookingRef={bookingResult.reference}
        qrCode={bookingResult.qr}
        show={show}
        movie={movie}
        seats={selected}
        totalAmount={discountedTotal}
        advancePaid={advancePaid}
        combos={combos}
        onDone={onBack}
      />
    );
  }

  if (stage === 'payment') {
    return (
      <PaymentProcessing
        show={show}
        movie={movie}
        seats={selected}
        totalAmount={totalAmount}
        advancePaid={advancePaid}
        balanceDue={balanceDue}
        selectedCombo={selectedCombo}
        onPaymentComplete={handlePaymentComplete}
        onBack={() => setStage('seats')}
      />
    );
  }

  const rows = [...new Set(seats.map(s => s.row_label))].sort();

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-5 transition-colors text-sm">
        <ArrowLeft size={18} /> Back to Shows
      </button>

      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">{movie.title}</h2>
        <p className="text-gray-400 text-sm mt-1">
          {show.theater?.name} • Screen {show.screen_number} •{' '}
          {new Date(show.show_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} •{' '}
          {show.show_time?.slice(0, 5)}
        </p>
      </div>

      {/* Screen */}
      <div className="text-center mb-6">
        <div className="inline-block bg-gradient-to-b from-amber-400/30 to-transparent w-48 h-2 rounded-t-full mb-1" />
        <p className="text-gray-500 text-xs">SCREEN</p>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mb-5 text-xs text-gray-400">
        {[
          { color: 'bg-gray-700', label: 'Available' },
          { color: 'bg-amber-500', label: 'Selected' },
          { color: 'bg-gray-600/40', label: 'Booked' },
          { color: 'bg-blue-500', label: 'Premium' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded ${l.color}`} />
            {l.label}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {rows.map(row => (
            <div key={row} className="flex items-center gap-2">
              <span className="w-5 text-center text-gray-500 text-xs font-mono">{row}</span>
              <div className="flex gap-1 flex-wrap">
                {seats.filter(s => s.row_label === row).map(seat => {
                  const isSelected = selected.some(s => s.id === seat.id);
                  return (
                    <button
                      key={seat.id}
                      onClick={() => toggleSeat(seat)}
                      disabled={seat.is_booked}
                      className={`w-8 h-7 rounded text-xs font-mono transition-all ${
                        seat.is_booked
                          ? 'bg-gray-800/40 text-gray-700 cursor-not-allowed'
                          : isSelected
                          ? 'bg-amber-500 text-gray-950 scale-110 shadow-lg shadow-amber-500/20'
                          : seat.seat_type === 'premium'
                          ? 'bg-blue-900/60 hover:bg-blue-700 text-blue-300 border border-blue-700/50'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      {seat.seat_number.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pricing */}
      <div className="bg-gray-900 rounded-xl p-4 mb-4 text-sm">
        <div className="grid grid-cols-2 gap-2 text-gray-400">
          <span>Regular: ₹{show.price_regular}/seat</span>
          <span>Premium: ₹{show.price_premium}/seat</span>
        </div>
      </div>

      {/* Combo Deals */}
      {combos.length > 0 && selected.length > 0 && (
        <div className="mb-5">
          <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Gift size={16} className="text-amber-400" /> Apply Combo Deal
          </h4>
          <div className="space-y-2">
            {combos.map(combo => (
              <button
                key={combo.id}
                onClick={() => setSelectedCombo(selectedCombo?.id === combo.id ? null : combo)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedCombo?.id === combo.id
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-gray-800 bg-gray-900 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">{combo.title}</p>
                    <p className="text-gray-400 text-xs">{combo.restaurant?.name}</p>
                  </div>
                  <span className="text-emerald-400 font-bold text-sm">-{combo.discount_percentage}%</span>
                </div>
                {selectedCombo?.id === combo.id && (
                  <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
                    Theater: {combo.commission_split.theater}% | Restaurant: {combo.commission_split.restaurant}%
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {selected.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-2 mb-3">
            <Info size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-amber-300 text-xs">75% advance payment required. Balance collected at theater.</p>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>Seats ({selected.map(s => s.seat_number).join(', ')})</span>
              <span>₹{totalAmount}</span>
            </div>
            {selectedCombo && (
              <div className="flex justify-between text-emerald-400">
                <span>Combo Discount</span>
                <span>-₹{Math.round(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-emerald-400 font-semibold pt-2 border-t border-gray-700">
              <span>Pay Now (75%)</span>
              <span>₹{advancePaid}</span>
            </div>
            <div className="flex justify-between text-amber-400 text-xs">
              <span>Pay at Theater (25%)</span>
              <span>₹{balanceDue}</span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleProceedToPayment}
        disabled={selected.length === 0}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-gray-800 disabled:text-gray-600 text-gray-950 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {selected.length === 0 ? (
          'Select seats to continue'
        ) : (
          <>
            <Check size={18} /> Proceed to Payment • ₹{advancePaid}
          </>
        )}
      </button>
    </div>
  );
}
