import { useEffect, useState } from 'react';
import { Plus, Calendar, Film, Clock, Trash2, AlertCircle } from 'lucide-react';
import { supabase, Theater, Movie, Show } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function ManageShows() {
  const { user } = useAuth();
  const [theater, setTheater] = useState<Theater | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    movie_id: '',
    show_date: '',
    show_time: '',
    screen_number: 1,
    total_seats: 100,
    price_regular: 200,
    price_premium: 350,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('theaters').select('*').eq('owner_id', user.id).maybeSingle().then(({ data }) => {
      setTheater(data);
      if (data) loadShows(data.id);
    });
    supabase.from('movies').select('*').eq('is_active', true).then(({ data }) => setMovies(data || []));
  }, [user]);

  const loadShows = async (theaterId: string) => {
    const { data } = await supabase
      .from('shows')
      .select('*, movie:movies(*)')
      .eq('theater_id', theaterId)
      .order('show_date', { ascending: false })
      .order('show_time');
    setShows(data || []);
  };

  const handleCreate = async () => {
    if (!theater || !form.movie_id || !form.show_date || !form.show_time) return;
    setSaving(true);
    await supabase.from('shows').insert({
      ...form,
      theater_id: theater.id,
      available_seats: form.total_seats,
    });
    await loadShows(theater.id);
    setShowForm(false);
    setForm({ movie_id: '', show_date: '', show_time: '', screen_number: 1, total_seats: 100, price_regular: 200, price_premium: 350 });
    setSaving(false);
  };

  const deleteShow = async (id: string) => {
    await supabase.from('shows').update({ is_active: false }).eq('id', id);
    if (theater) loadShows(theater.id);
  };

  const timeSlots = ['10:00', '13:00', '16:00', '19:00', '22:00'];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Manage Shows</h1>
          <p className="text-gray-400">Schedule and manage movie screenings</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={!theater}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all"
        >
          <Plus size={16} /> Add Show
        </button>
      </div>

      {!theater && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-5 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-sm">Please set up your theater in "Theater Setup" before scheduling shows.</p>
        </div>
      )}

      {showForm && theater && (
        <div className="bg-gray-900 rounded-xl p-5 mb-5 border border-gray-700">
          <h3 className="text-white font-semibold mb-4">Schedule New Show</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1.5">Movie *</label>
              <select
                value={form.movie_id}
                onChange={e => setForm(p => ({ ...p, movie_id: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
              >
                <option value="">Select a movie</option>
                {movies.map(m => <option key={m.id} value={m.id}>{m.title} ({m.language})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Date *</label>
              <input
                type="date"
                value={form.show_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(p => ({ ...p, show_date: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Time *</label>
              <select
                value={form.show_time}
                onChange={e => setForm(p => ({ ...p, show_time: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
              >
                <option value="">Select time</option>
                {timeSlots.map(t => <option key={t} value={t + ':00'}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Screen Number</label>
              <input
                type="number"
                min={1}
                max={theater.total_screens}
                value={form.screen_number}
                onChange={e => setForm(p => ({ ...p, screen_number: parseInt(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Total Seats</label>
              <input
                type="number"
                min={10}
                value={form.total_seats}
                onChange={e => setForm(p => ({ ...p, total_seats: parseInt(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Regular Price (₹)</label>
              <input
                type="number"
                value={form.price_regular}
                onChange={e => setForm(p => ({ ...p, price_regular: parseInt(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Premium Price (₹)</label>
              <input
                type="number"
                value={form.price_premium}
                onChange={e => setForm(p => ({ ...p, price_premium: parseInt(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={saving || !form.movie_id || !form.show_date || !form.show_time}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Schedule Show'}
            </button>
            <button onClick={() => setShowForm(false)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-5 py-2.5 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {shows.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Calendar size={40} className="mx-auto mb-3 text-gray-700" />
          <p>No shows scheduled yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shows.map(show => {
            const movie = show.movie as any;
            return (
              <div key={show.id} className="flex items-center justify-between bg-gray-900 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Film size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{movie?.title}</p>
                    <div className="flex items-center gap-3 text-gray-500 text-xs mt-0.5">
                      <span className="flex items-center gap-1"><Calendar size={10} />
                        {new Date(show.show_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="flex items-center gap-1"><Clock size={10} />{show.show_time.slice(0, 5)}</span>
                      <span>Screen {show.screen_number}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-emerald-400 text-sm font-medium">{show.available_seats} seats left</p>
                    <p className="text-gray-500 text-xs">₹{show.price_regular} / ₹{show.price_premium}</p>
                  </div>
                  <button
                    onClick={() => deleteShow(show.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
