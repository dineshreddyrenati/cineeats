import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Clock, Users, CheckCircle } from 'lucide-react';
import { supabase, Restaurant, TableSlot } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Props {
  restaurant: Restaurant;
  onBack: () => void;
  linkedBookingId?: string;
}

export default function TableReservation({ restaurant, onBack, linkedBookingId }: Props) {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partySize, setPartySize] = useState(2);
  const [slots, setSlots] = useState<TableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TableSlot | null>(null);
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const timeSlots = ['11:00', '12:00', '13:00', '14:00', '18:00', '19:00', '20:00', '21:00'];

  useEffect(() => {
    loadSlots();
  }, [date, restaurant.id]);

  const loadSlots = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('table_slots')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('slot_date', date)
      .order('slot_time');

    if (data && data.length > 0) {
      setSlots(data);
    } else {
      // Generate default slots
      const generated = timeSlots.flatMap(time =>
        ['T1', 'T2', 'T3', 'T4'].map(table => ({
          restaurant_id: restaurant.id,
          table_number: table,
          capacity: table === 'T1' || table === 'T2' ? 2 : 4,
          slot_date: date,
          slot_time: time + ':00',
          is_reserved: Math.random() < 0.3,
        }))
      );
      const { data: inserted } = await supabase.from('table_slots').insert(generated).select();
      setSlots(inserted || []);
    }
    setLoading(false);
  };

  const handleReserve = async () => {
    if (!user || !selectedSlot) return;
    setSubmitting(true);
    await supabase.from('table_reservations').insert({
      user_id: user.id,
      restaurant_id: restaurant.id,
      table_slot_id: selectedSlot.id,
      reservation_date: date,
      reservation_time: selectedSlot.slot_time,
      party_size: partySize,
      special_requests: specialRequests,
      linked_booking_id: linkedBookingId || null,
    });
    await supabase.from('table_slots').update({ is_reserved: true }).eq('id', selectedSlot.id);
    setConfirmed(true);
    setSubmitting(false);
  };

  if (confirmed) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Table Reserved!</h2>
          <p className="text-gray-400 mb-6">Your table at {restaurant.name} is confirmed.</p>
          <div className="bg-gray-900 rounded-xl p-4 text-left mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Restaurant</span>
              <span className="text-white">{restaurant.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Date</span>
              <span className="text-white">{new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Time</span>
              <span className="text-white">{selectedSlot?.slot_time.slice(0, 5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Table</span>
              <span className="text-white">{selectedSlot?.table_number} (Cap: {selectedSlot?.capacity})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Party Size</span>
              <span className="text-white">{partySize} persons</span>
            </div>
          </div>
          <button onClick={onBack} className="w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-3 rounded-xl">
            Done
          </button>
        </div>
      </div>
    );
  }

  const availableSlots = slots.filter(s => !s.is_reserved && s.capacity >= partySize);
  const groupedByTime = timeSlots.reduce((acc, time) => {
    const timeSlotItems = availableSlots.filter(s => s.slot_time.startsWith(time));
    if (timeSlotItems.length > 0) acc[time] = timeSlotItems;
    return acc;
  }, {} as Record<string, TableSlot[]>);

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-5 transition-colors text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <h2 className="text-xl font-bold text-white mb-1">Reserve a Table</h2>
      <p className="text-gray-400 text-sm mb-5">{restaurant.name}</p>

      {/* Date */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
          <Calendar size={14} /> Select Date
        </label>
        <input
          type="date"
          value={date}
          min={new Date().toISOString().split('T')[0]}
          onChange={e => setDate(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm transition-colors"
        />
      </div>

      {/* Party size */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
          <Users size={14} /> Party Size
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <button
              key={n}
              onClick={() => setPartySize(n)}
              className={`w-10 h-10 rounded-xl font-semibold text-sm transition-all ${
                partySize === n ? 'bg-amber-500 text-gray-950' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Available slots */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
          <Clock size={14} /> Available Time Slots
        </label>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-900 rounded-xl h-16 animate-pulse" />)}
          </div>
        ) : Object.keys(groupedByTime).length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">No tables available for {partySize} persons on this date</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(groupedByTime).map(([time, timeSlots]) => (
              <div key={time}>
                <p className="text-gray-500 text-xs mb-1.5 font-medium">{time}</p>
                <div className="flex gap-2 flex-wrap">
                  {timeSlots.map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        selectedSlot?.id === slot.id
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-gray-700 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {slot.table_number} (for {slot.capacity})
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Special requests */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-400 mb-2">Special Requests (optional)</label>
        <textarea
          value={specialRequests}
          onChange={e => setSpecialRequests(e.target.value)}
          placeholder="Window seat, birthday decoration, dietary requirements..."
          rows={3}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 text-sm resize-none transition-colors"
        />
      </div>

      <button
        onClick={handleReserve}
        disabled={!selectedSlot || submitting}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {submitting ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          'Confirm Reservation'
        )}
      </button>
    </div>
  );
}
