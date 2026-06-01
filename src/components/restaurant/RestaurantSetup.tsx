import { useEffect, useState } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { supabase, Restaurant } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function RestaurantSetup() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    image_url: '',
    commission_rate: 10,
    delivery_time_minutes: 30,
    minimum_order: 200,
    cuisine_type: [] as string[],
    opening_hours: { open: '09:00', close: '23:00' },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const cuisineOptions = ['Indian', 'Chinese', 'Italian', 'Fast Food', 'Continental', 'South Indian', 'Desserts', 'Mexican', 'Thai', 'Japanese'];

  useEffect(() => {
    if (!user) return;
    supabase.from('restaurants').select('*').eq('owner_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setRestaurant(data);
        setForm({
          name: data.name,
          address: data.address,
          city: data.city,
          image_url: data.image_url,
          commission_rate: data.commission_rate,
          delivery_time_minutes: data.delivery_time_minutes,
          minimum_order: data.minimum_order,
          cuisine_type: data.cuisine_type || [],
          opening_hours: data.opening_hours || { open: '09:00', close: '23:00' },
        });
      }
    });
  }, [user]);

  const toggleCuisine = (c: string) => {
    setForm(prev => ({
      ...prev,
      cuisine_type: prev.cuisine_type.includes(c) ? prev.cuisine_type.filter(x => x !== c) : [...prev.cuisine_type, c],
    }));
  };

  const handleSave = async () => {
    if (!user || !form.name || !form.city) return;
    setSaving(true);
    if (restaurant) {
      await supabase.from('restaurants').update({ ...form }).eq('id', restaurant.id);
    } else {
      const { data } = await supabase.from('restaurants').insert({ ...form, owner_id: user.id }).select().single();
      if (data) setRestaurant(data);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Restaurant Setup</h1>
        <p className="text-gray-400">Configure your restaurant details</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Restaurant Name *</label>
          <input
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g., Spice Garden"
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">City *</label>
            <input
              value={form.city}
              onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              placeholder="Mumbai"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Delivery Time (min)</label>
            <input
              type="number"
              value={form.delivery_time_minutes}
              onChange={e => setForm(p => ({ ...p, delivery_time_minutes: parseInt(e.target.value) }))}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Address</label>
          <input
            value={form.address}
            onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
            placeholder="Full address"
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Restaurant Image URL</label>
          <input
            value={form.image_url}
            onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
            placeholder="https://images.pexels.com/..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Min. Order (₹)</label>
            <input
              type="number"
              value={form.minimum_order}
              onChange={e => setForm(p => ({ ...p, minimum_order: parseFloat(e.target.value) }))}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Commission Rate (%)</label>
            <input
              type="number"
              min={0}
              max={30}
              value={form.commission_rate}
              onChange={e => setForm(p => ({ ...p, commission_rate: parseFloat(e.target.value) }))}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Opening Time</label>
            <input
              type="time"
              value={form.opening_hours.open}
              onChange={e => setForm(p => ({ ...p, opening_hours: { ...p.opening_hours, open: e.target.value } }))}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Closing Time</label>
            <input
              type="time"
              value={form.opening_hours.close}
              onChange={e => setForm(p => ({ ...p, opening_hours: { ...p.opening_hours, close: e.target.value } }))}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Cuisine Types</label>
          <div className="flex flex-wrap gap-2">
            {cuisineOptions.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCuisine(c)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  form.cuisine_type.includes(c)
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !form.name || !form.city}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold px-6 py-3 rounded-xl transition-all"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <><CheckCircle size={16} /> Saved!</>
          ) : (
            <><Save size={16} /> {restaurant ? 'Update Restaurant' : 'Create Restaurant'}</>
          )}
        </button>
      </div>
    </div>
  );
}
