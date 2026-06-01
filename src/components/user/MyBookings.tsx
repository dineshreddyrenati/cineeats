import { useEffect, useState } from 'react';
import { Calendar, Film, QrCode, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase, Booking } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

function QRDisplay({ data }: { data: string }) {
  const hash = data.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const size = 6;
  const grid = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => ((hash * (i + 1) * (j + 1)) % 3) !== 0)
  );
  return (
    <div className="bg-white p-2 rounded-lg inline-block">
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {grid.flat().map((f, idx) => (
          <div key={idx} className={`w-4 h-4 ${f ? 'bg-gray-950' : 'bg-white'}`} />
        ))}
      </div>
    </div>
  );
}

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('bookings')
      .select('*, show:shows(*, theater:theaters(*), movie:movies(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBookings(data || []);
        setLoading(false);
      });
  }, [user]);

  const statusConfig = {
    confirmed: { icon: <CheckCircle size={14} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Confirmed' },
    cancelled: { icon: <XCircle size={14} />, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Cancelled' },
    completed: { icon: <CheckCircle size={14} />, color: 'text-gray-400', bg: 'bg-gray-700', label: 'Completed' },
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">My Bookings</h1>
        <p className="text-gray-400">Your movie tickets and QR codes</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-900 rounded-xl h-24 animate-pulse" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20">
          <Film size={40} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No bookings yet</p>
          <p className="text-gray-600 text-sm mt-1">Book a movie to see your tickets here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(booking => {
            const show = booking.show as any;
            const status = statusConfig[booking.booking_status];
            const isExpanded = expandedId === booking.id;

            return (
              <div key={booking.id} className="bg-gray-900 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Film size={18} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{show?.movie?.title}</p>
                    <div className="flex items-center gap-3 text-gray-500 text-xs mt-0.5">
                      <span className="flex items-center gap-1"><MapPin size={10} />{show?.theater?.name}</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {show?.show_date ? new Date(show.show_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                      </span>
                      <span className="flex items-center gap-1"><Clock size={10} />{show?.show_time?.slice(0, 5)}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${status.color} ${status.bg}`}>
                      {status.icon} {status.label}
                    </span>
                    <p className="text-gray-600 text-xs mt-1 font-mono">{booking.booking_reference}</p>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-800 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Screen</p>
                          <p className="text-white">Screen {show?.screen_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Seats</p>
                          <p className="text-white">{booking.num_seats} seat(s)</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Total Amount</p>
                          <p className="text-white">₹{booking.total_amount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Paid (75%)</p>
                          <p className="text-emerald-400 font-semibold">₹{booking.advance_paid}</p>
                        </div>
                        {booking.balance_due > 0 && (
                          <div>
                            <p className="text-gray-500 text-xs">Pay at Theater</p>
                            <p className="text-amber-400">₹{booking.balance_due}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center">
                        <QRDisplay data={booking.qr_code || booking.booking_reference} />
                        <p className="text-gray-500 text-xs mt-2 text-center">Show at entrance</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
