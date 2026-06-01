import { useState } from 'react';
import { QrCode, Search, CheckCircle, XCircle, AlertCircle, Ticket } from 'lucide-react';
import { supabase, Booking } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function QRVerification() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ booking: Booking & { show: any }; valid: boolean; message: string } | null>(null);
  const [searching, setSearching] = useState(false);

  const verify = async () => {
    if (!input.trim()) return;
    setSearching(true);
    setResult(null);

    // Search by booking reference or QR code
    const { data } = await supabase
      .from('bookings')
      .select('*, show:shows(*, theater:theaters(*), movie:movies(*))')
      .or(`booking_reference.eq.${input.trim().toUpperCase()},qr_code.ilike.%${input.trim()}%`)
      .maybeSingle();

    if (!data) {
      setResult({ booking: null as any, valid: false, message: 'Ticket not found. Please check the reference number.' });
      setSearching(false);
      return;
    }

    const show = data.show as any;
    // Verify this booking belongs to the theater rep's theater
    if (show?.theater?.owner_id !== user?.id) {
      setResult({ booking: data as any, valid: false, message: 'This ticket is not for your theater.' });
      setSearching(false);
      return;
    }

    if (data.booking_status === 'cancelled') {
      setResult({ booking: data as any, valid: false, message: 'This ticket has been cancelled.' });
      setSearching(false);
      return;
    }

    if (data.booking_status === 'completed') {
      setResult({ booking: data as any, valid: false, message: 'This ticket has already been used.' });
      setSearching(false);
      return;
    }

    setResult({ booking: data as any, valid: true, message: 'Valid ticket! Customer may proceed.' });
    setSearching(false);
  };

  const markUsed = async () => {
    if (!result?.booking) return;
    await supabase.from('bookings').update({ booking_status: 'completed' }).eq('id', result.booking.id);
    setResult(prev => prev ? { ...prev, valid: false, message: 'Ticket marked as used.' } : null);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">QR Verification</h1>
        <p className="text-gray-400">Scan or enter booking reference to verify tickets</p>
      </div>

      {/* Input */}
      <div className="bg-gray-900 rounded-xl p-6 mb-5">
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center">
            <QrCode size={40} className="text-blue-400" />
          </div>
        </div>

        <label className="block text-sm font-medium text-gray-400 mb-2">Booking Reference or QR Code</label>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verify()}
            placeholder="e.g., AB1234CD"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm uppercase tracking-widest"
          />
          <button
            onClick={verify}
            disabled={searching || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-2 text-sm"
          >
            {searching ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Search size={16} /> Verify</>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl overflow-hidden border ${
          result.valid
            ? 'border-emerald-500/30 bg-emerald-500/10'
            : 'border-red-500/30 bg-red-500/10'
        }`}>
          <div className="p-4 flex items-center gap-3">
            {result.valid
              ? <CheckCircle size={24} className="text-emerald-400 flex-shrink-0" />
              : <XCircle size={24} className="text-red-400 flex-shrink-0" />
            }
            <p className={`font-semibold ${result.valid ? 'text-emerald-300' : 'text-red-300'}`}>
              {result.message}
            </p>
          </div>

          {result.booking && (
            <div className="px-4 pb-4 grid grid-cols-2 gap-3 text-sm border-t border-gray-700 pt-4">
              <div>
                <p className="text-gray-500 text-xs">Movie</p>
                <p className="text-white">{result.booking.show?.movie?.title}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Reference</p>
                <p className="text-white font-mono">{result.booking.booking_reference}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Show Date & Time</p>
                <p className="text-white">
                  {new Date(result.booking.show?.show_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {result.booking.show?.show_time?.slice(0, 5)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Screen</p>
                <p className="text-white">Screen {result.booking.show?.screen_number}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Seats</p>
                <p className="text-white">{result.booking.num_seats} seat(s)</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Balance Due</p>
                <p className="text-amber-400 font-semibold">₹{result.booking.balance_due}</p>
              </div>
            </div>
          )}

          {result.valid && (
            <div className="px-4 pb-4">
              <button
                onClick={markUsed}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >
                <Ticket size={16} /> Mark as Used & Allow Entry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-5 bg-gray-900 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-gray-400 text-sm">
          Enter the 8-character booking reference from the customer's ticket, or the QR code data.
          After verification, collect the 25% balance due and mark the ticket as used.
        </p>
      </div>
    </div>
  );
}
