import { useState } from 'react';
import { CreditCard, Smartphone, Building2, Shield, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase, Show, Movie, Seat, ComboDeal, Payment } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Props {
  show: Show;
  movie: Movie;
  seats: Seat[];
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  selectedCombo: ComboDeal | null;
  onPaymentComplete: (bookingRef: string, qrCode: string, paymentId: string) => void;
  onBack: () => void;
}

export default function PaymentProcessing({
  show,
  movie,
  seats,
  totalAmount,
  advancePaid,
  balanceDue,
  selectedCombo,
  onPaymentComplete,
  onBack,
}: Props) {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const platformFeeRate = 0.02; // 2% platform fee

  // Calculate commission split if combo deal is applied
  const calculateCommissions = () => {
    if (!selectedCombo) {
      // Default: 100% goes to theater for ticket bookings
      return {
        theaterCommission: advancePaid - (advancePaid * platformFeeRate),
        restaurantCommission: 0,
        platformFee: advancePaid * platformFeeRate,
      };
    }

    const split = selectedCombo.commission_split;
    const theaterShare = (advancePaid * split.theater) / 100;
    const restaurantShare = (advancePaid * split.restaurant) / 100;
    const platformFee = advancePaid * platformFeeRate;

    return {
      theaterCommission: theaterShare - platformFee,
      restaurantCommission: restaurantShare,
      platformFee,
    };
  };

  const handlePayment = async () => {
    if (!user) return;
    setProcessing(true);
    setError('');

    try {
      // Step 1: Create payment record
      const transactionId = `TXN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const commissions = calculateCommissions();

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          payment_type: selectedCombo ? 'combo_booking' : 'ticket_booking',
          reference_id: 'temp', // Will update after booking creation
          user_id: user.id,
          amount: advancePaid,
          platform_fee: commissions.platformFee,
          theater_commission: commissions.theaterCommission,
          restaurant_commission: commissions.restaurantCommission,
          commission_rate: selectedCombo?.commission_split.theater || 100,
          payment_method: paymentMethod,
          payment_status: 'completed',
          transaction_id: transactionId,
          completed_at: new Date().toISOString(),
          combo_deal_id: selectedCombo?.id,
        })
        .select()
        .single();

      if (paymentError || !payment) {
        throw new Error('Payment processing failed');
      }

      // Step 2: Create booking
      const qrData = `CINEATS-${Date.now()}-${user.id.slice(0, 8)}`;
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          show_id: show.id,
          total_amount: totalAmount,
          advance_paid: advancePaid,
          balance_due: balanceDue,
          payment_status: 'advance_paid',
          num_seats: seats.length,
          qr_code: qrData,
          payment_id: payment.id,
          combo_deal_id: selectedCombo?.id,
        })
        .select()
        .single();

      if (bookingError || !booking) {
        throw new Error('Booking creation failed');
      }

      // Step 3: Update payment with booking reference
      await supabase
        .from('payments')
        .update({ reference_id: booking.id })
        .eq('id', payment.id);

      // Step 4: Create booking seats
      await supabase.from('booking_seats').insert(
        seats.map(s => ({ booking_id: booking.id, seat_id: s.id }))
      );

      // Step 5: Mark seats as booked
      await supabase
        .from('seats')
        .update({ is_booked: true })
        .in('id', seats.map(s => s.id));

      // Step 6: Update available seats
      await supabase
        .from('shows')
        .update({ available_seats: show.available_seats - seats.length })
        .eq('id', show.id);

      // Step 7: Update combo deal stats if applied
      if (selectedCombo) {
        await supabase
          .from('combo_deals')
          .update({
            total_bookings: selectedCombo.total_bookings + 1,
            total_revenue: selectedCombo.total_revenue + advancePaid,
          })
          .eq('id', selectedCombo.id);
      }

      // Step 8: Record commission for restaurant if applicable
      if (commissions.restaurantCommission > 0) {
        const now = new Date();
        await supabase.from('commissions').insert({
          restaurant_id: selectedCombo!.restaurant_id,
          food_order_id: null,
          commission_amount: commissions.restaurantCommission,
          commission_rate: selectedCombo!.commission_split.restaurant,
          order_total: advancePaid,
          period_month: now.getMonth() + 1,
          period_year: now.getFullYear(),
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onPaymentComplete(booking.booking_reference, qrData, payment.id);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { id: 'card', label: 'Credit/Debit Card', icon: <CreditCard size={20} />, desc: 'Visa, Mastercard, RuPay' },
    { id: 'upi', label: 'UPI', icon: <Smartphone size={20} />, desc: 'Google Pay, PhonePe, Paytm' },
    { id: 'netbanking', label: 'Net Banking', icon: <Building2 size={20} />, desc: 'All major banks' },
  ];

  if (success) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
        <p className="text-gray-400">Your booking is being confirmed...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Secure Payment</h2>
        <p className="text-gray-400">Complete payment to confirm your booking</p>
      </div>

      {/* Booking Summary */}
      <div className="bg-gray-900 rounded-xl p-4 mb-5">
        <h3 className="text-white font-semibold mb-3">{movie.title}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
          <div>Theater: <span className="text-white">{show.theater?.name}</span></div>
          <div>Screen: <span className="text-white">{show.screen_number}</span></div>
          <div>Date: <span className="text-white">{new Date(show.show_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></div>
          <div>Time: <span className="text-white">{show.show_time?.slice(0, 5)}</span></div>
          <div className="col-span-2">Seats: <span className="text-white">{seats.map(s => s.seat_number).join(', ')}</span></div>
        </div>
      </div>

      {/* Combo Applied */}
      {selectedCombo && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-400 font-semibold">{selectedCombo.title}</p>
              <p className="text-gray-400 text-xs">{selectedCombo.restaurant?.name} discount applied</p>
            </div>
            <span className="text-emerald-400 font-bold">-{selectedCombo.discount_percentage}%</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700 text-xs">
            <p className="text-gray-400">Revenue Split: Theater {selectedCombo.commission_split.theater}% | Restaurant {selectedCombo.commission_split.restaurant}%</p>
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="bg-gray-900 rounded-xl p-4 mb-5 text-sm">
        <div className="flex justify-between text-gray-400 mb-2">
          <span>Total Amount</span>
          <span className="text-white">₹{totalAmount}</span>
        </div>
        {selectedCombo && (
          <div className="flex justify-between text-emerald-400 mb-2">
            <span>Combo Discount</span>
            <span>-{selectedCombo.discount_percentage}%</span>
          </div>
        )}
        <div className="flex justify-between text-emerald-400 font-semibold text-base border-t border-gray-800 pt-2 mt-2">
          <span>Pay Now (75%)</span>
          <span>₹{advancePaid}</span>
        </div>
        <div className="flex justify-between text-amber-400 text-xs mt-1">
          <span>Pay at Theater</span>
          <span>₹{balanceDue}</span>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-5">
        <p className="text-sm font-medium text-gray-400 mb-3">Select Payment Method</p>
        <div className="space-y-2">
          {paymentMethods.map(method => (
            <button
              key={method.id}
              onClick={() => setPaymentMethod(method.id as any)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all ${
                paymentMethod === method.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-gray-800 bg-gray-900 hover:bg-gray-800'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                paymentMethod === method.id ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-400'
              }`}>
                {method.icon}
              </div>
              <div className="text-left">
                <p className={`text-sm font-medium ${paymentMethod === method.id ? 'text-white' : 'text-gray-300'}`}>
                  {method.label}
                </p>
                <p className="text-xs text-gray-500">{method.desc}</p>
              </div>
              {paymentMethod === method.id && (
                <CheckCircle size={16} className="text-amber-400 ml-auto" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-gray-900 rounded-lg p-3 mb-5 flex items-center gap-3">
        <Shield size={20} className="text-emerald-400" />
        <div className="text-xs text-gray-400">
          <p className="text-white font-medium">Secure Payment</p>
          <p>256-bit SSL encrypted. Your card details are safe.</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={processing}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-gray-800 disabled:text-gray-600 text-gray-950 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <div className="w-5 h-5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock size={18} /> Pay ₹{advancePaid}
          </>
        )}
      </button>

      <button
        onClick={onBack}
        disabled={processing}
        className="w-full text-gray-500 hover:text-white mt-3 text-sm disabled:opacity-50"
      >
        Back to Seat Selection
      </button>
    </div>
  );
}
