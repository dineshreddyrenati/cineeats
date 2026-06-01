import { useEffect, useState } from 'react';
import { Building2, Save, CheckCircle } from 'lucide-react';
import { supabase, Theater } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function TheaterSetup() {
  const { user } = useAuth();
  const [theater, setTheater] = useState<Theater | null>(null);
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    total_screens: 1,
    image_url: '',
    amenities: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const amenityOptions = ['Parking', 'Food Court', 'IMAX', '4DX', 'Dolby Atmos', 'Recliner Seats', 'Wheelchair Access', 'ATM'];

  useEffect(() => {
    if (!user) return;
    supabase.from('theaters').select('*').eq('owner_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setTheater(data);
        setForm({
          name: data.name,
          address: data.address,
          city: data.city,
          total_screens: data.total_screens,
          image_url: data.image_url,
          amenities: data.amenities || [],
        });
      }
    });
  }, [user]);

  const toggleAmenity = (a: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a) ? prev.amenities.filter(x => x !== a) : [...prev.amenities, a],
    }));
  };

  const handleSave = async () => {
    if (!user || !form.name || !form.city) return;
    setSaving(true);
    if (theater) {
      await supabase.from('theaters').update({ ...form }).eq('id', theater.id);
    } else {
      const { data } = await supabase.from('theaters').insert({ ...form, owner_id: user.id }).select().single();
      if (data) setTheater(data);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Theater Setup</h1>
        <p className="text-gray-400">Configure your theater details for customers</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Theater Name *</label>
          <input
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g., PVR Cinemas, INOX Megaplex"
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">City *</label>
            <input
              value={form.city}
              onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              placeholder="Mumbai"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Total Screens</label>
            <input
              type="number"
              min={1}
              value={form.total_screens}
              onChange={e => setForm(p => ({ ...p, total_screens: parseInt(e.target.value) || 1 }))}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Address</label>
          <input
            value={form.address}
            onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
            placeholder="Full address"
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Theater Image URL</label>
          <input
            value={form.image_url}
            onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
            placeholder="https://..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  form.amenities.includes(a)
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !form.name || !form.city}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold px-6 py-3 rounded-xl transition-all"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <><CheckCircle size={16} /> Saved!</>
          ) : (
            <><Save size={16} /> {theater ? 'Update Theater' : 'Create Theater'}</>
          )}
        </button>
      </div>
    </div>
  );
}
