import { useEffect, useState } from 'react';
import { Calendar, Users, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase, TableReservation } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function ReservationManager() {
  const { user } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<TableReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('restaurants').select('id').eq('owner_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setRestaurantId(data.id);
        loadReservations(data.id, date);
      } else setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (restaurantId) loadReservations(restaurantId, date);
  }, [date]);

  const loadReservations = async (restId: string, d: string) => {
    const { data } = await supabase
      .from('table_reservations')
      .select('*')
      .eq('restaurant_id', restId)
      .eq('reservation_date', d)
      .order('reservation_time');
    setReservations(data || []);
    setLoading(false);
  };

  const refresh = async () => {
    if (!restaurantId) return;
    setRefreshing(true);
    await loadReservations(restaurantId, date);
    setRefreshing(false);
  };

  const updateStatus = async (id: string, status: TableReservation['status']) => {
    await supabase.from('table_reservations').update({ status }).eq('id', id);
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const statusColors: Record<string, string> = {
    confirmed: 'text-emerald-400',
    cancelled: 'text-red-400',
    completed: 'text-gray-400',
    no_show: 'text-orange-400',
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Reservations</h1>
          <p className="text-gray-400">Manage table bookings</p>
        </div>
        <button onClick={refresh} className={`text-gray-400 hover:text-white ${refreshing ? 'animate-spin' : ''}`}>
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="mb-5">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-900 rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Calendar size={40} className="mx-auto mb-3 text-gray-700" />
          <p>No reservations for {new Date(date + 'T12:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map(res => (
            <div key={res.id} className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Calendar size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm flex items-center gap-1.5">
                        <Clock size={13} className="text-gray-500" /> {res.reservation_time.slice(0, 5)}
                      </p>
                      <p className="text-white font-semibold text-sm flex items-center gap-1.5">
                        <Users size={13} className="text-gray-500" /> {res.party_size} persons
                      </p>
                    </div>
                    {res.special_requests && (
                      <p className="text-gray-400 text-xs mt-0.5">"{res.special_requests}"</p>
                    )}
                    {res.linked_booking_id && (
                      <p className="text-amber-400 text-xs mt-0.5">Linked to movie booking</p>
                    )}
                  </div>
                </div>
                <p className={`text-sm font-medium capitalize ${statusColors[res.status] || 'text-gray-400'}`}>{res.status}</p>
              </div>

              {res.status === 'confirmed' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(res.id, 'completed')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium"
                  >
                    <CheckCircle size={12} /> Completed
                  </button>
                  <button
                    onClick={() => updateStatus(res.id, 'no_show')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-xs font-medium"
                  >
                    No Show
                  </button>
                  <button
                    onClick={() => updateStatus(res.id, 'cancelled')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium"
                  >
                    <XCircle size={12} /> Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
