import { useEffect, useState } from 'react';
import { Plus, Gift, Trash2, Building2 } from 'lucide-react';
import { supabase, Theater, Restaurant, ComboDeal } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function ComboDealManager() {
  const { user } = useAuth();
  const [theater, setTheater] = useState<Theater | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [combos, setCombos] = useState<ComboDeal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    restaurant_id: '',
    title: '',
    description: '',
    discount_percentage: 10,
    min_ticket_count: 2,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    terms_conditions: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('theaters').select('*').eq('owner_id', user.id).maybeSingle().then(({ data }) => {
      setTheater(data);
      if (data) loadCombos(data.id);
    });
    supabase.from('restaurants').select('*').eq('is_active', true).then(({ data }) => setRestaurants(data || []));
  }, [user]);

  const loadCombos = async (theaterId: string) => {
    const { data } = await supabase
      .from('combo_deals')
      .select('*, restaurant:restaurants(*)')
      .eq('theater_id', theaterId)
      .order('created_at', { ascending: false });
    setCombos(data || []);
  };

  const createCombo = async () => {
    if (!theater || !form.restaurant_id || !form.title) return;
    setSaving(true);
    await supabase.from('combo_deals').insert({ ...form, theater_id: theater.id });
    await loadCombos(theater.id);
    setShowForm(false);
    setForm({ restaurant_id: '', title: '', description: '', discount_percentage: 10, min_ticket_count: 2, valid_from: new Date().toISOString().split('T')[0], valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], terms_conditions: '' });
    setSaving(false);
  };

  const deleteCombo = async (id: string) => {
    await supabase.from('combo_deals').update({ is_active: false }).eq('id', id);
    if (theater) loadCombos(theater.id);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Combo Deals</h1>
          <p className="text-gray-400">Partner with restaurants for exclusive offers</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={!theater || restaurants.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all"
        >
          <Plus size={16} /> New Combo
        </button>
      </div>

      {!theater && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-5">
          <p className="text-amber-300 text-sm">Please set up your theater first before creating combo deals.</p>
        </div>
      )}

      {theater && restaurants.length === 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-5 flex items-center gap-3">
          <Building2 size={16} className="text-gray-400" />
          <p className="text-gray-400 text-sm">No restaurant partners available yet. Combos require registered restaurant partners.</p>
        </div>
      )}

      {showForm && theater && restaurants.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 mb-5 border border-gray-700">
          <h3 className="text-white font-semibold mb-4">Create Combo Deal</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Partner Restaurant *</label>
              <select
                value={form.restaurant_id}
                onChange={e => setForm(p => ({ ...p, restaurant_id: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Select restaurant</option>
                {restaurants.map(r => <option key={r.id} value={r.id}>{r.name} - {r.city}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Deal Title *</label>
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g., Movie + Dinner Combo"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Short description of the offer"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Discount %</label>
              <input
                type="number"
                min={1}
                max={50}
                value={form.discount_percentage}
                onChange={e => setForm(p => ({ ...p, discount_percentage: parseFloat(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Min Tickets Required</label>
              <input
                type="number"
                min={1}
                value={form.min_ticket_count}
                onChange={e => setForm(p => ({ ...p, min_ticket_count: parseInt(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Valid From</label>
              <input
                type="date"
                value={form.valid_from}
                onChange={e => setForm(p => ({ ...p, valid_from: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Valid Until</label>
              <input
                type="date"
                value={form.valid_until}
                onChange={e => setForm(p => ({ ...p, valid_until: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={createCombo}
              disabled={saving || !form.restaurant_id || !form.title}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white font-semibold px-5 py-2 rounded-xl text-sm flex items-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Deal'}
            </button>
            <button onClick={() => setShowForm(false)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-5 py-2 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {combos.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Gift size={40} className="mx-auto mb-3 text-gray-700" />
          <p>No combo deals created yet</p>
          <p className="text-sm text-gray-600 mt-1">Partner with restaurants to offer combined deals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {combos.map(combo => {
            const rest = combo.restaurant as any;
            const isExpired = new Date(combo.valid_until) < new Date();
            return (
              <div key={combo.id} className={`bg-gray-900 rounded-xl p-4 ${isExpired ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold">{combo.title}</h3>
                      {isExpired ? (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Expired</span>
                      ) : (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Active</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{combo.description}</p>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span className="text-amber-400 font-medium">{combo.discount_percentage}% off</span>
                      <span>Min {combo.min_ticket_count} tickets</span>
                      <span className="flex items-center gap-1"><Building2 size={10} />{rest?.name}</span>
                      <span>Until {new Date(combo.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteCombo(combo.id)} className="text-gray-600 hover:text-red-400 transition-colors ml-3">
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
