import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Leaf, BookOpen, AlertCircle } from 'lucide-react';
import { supabase, MenuItem, Restaurant } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['Starters', 'Main Course', 'Breads', 'Rice & Biryani', 'Desserts', 'Beverages', 'Soups', 'Salads', 'Snacks', 'Specials'];

const DEFAULT_FORM = {
  name: '',
  description: '',
  category: 'Main Course',
  price: '',
  image_url: '',
  is_vegetarian: false,
  is_vegan: false,
  preparation_time_minutes: 20,
  customization_options: [] as { name: string; choices: string[]; required: boolean }[],
};

export default function MenuManager() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomChoices, setNewCustomChoices] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('restaurants').select('*').eq('owner_id', user.id).maybeSingle().then(({ data }) => {
      setRestaurant(data);
      if (data) loadItems(data.id);
    });
  }, [user]);

  const loadItems = async (restId: string) => {
    const { data } = await supabase.from('menu_items').select('*').eq('restaurant_id', restId).order('category').order('name');
    setItems(data || []);
  };

  const openAdd = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item: MenuItem) => {
    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      price: String(item.price),
      image_url: item.image_url,
      is_vegetarian: item.is_vegetarian,
      is_vegan: item.is_vegan,
      preparation_time_minutes: item.preparation_time_minutes,
      customization_options: item.customization_options || [],
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!restaurant || !form.name || !form.price) return;
    setSaving(true);
    const payload = {
      ...form,
      price: parseFloat(form.price),
      restaurant_id: restaurant.id,
    };
    if (editingId) {
      await supabase.from('menu_items').update(payload).eq('id', editingId);
    } else {
      await supabase.from('menu_items').insert(payload);
    }
    await loadItems(restaurant.id);
    setShowForm(false);
    setSaving(false);
  };

  const deleteItem = async (id: string) => {
    await supabase.from('menu_items').update({ is_available: false }).eq('id', id);
    if (restaurant) loadItems(restaurant.id);
  };

  const addCustomization = () => {
    if (!newCustomName || !newCustomChoices) return;
    const choices = newCustomChoices.split(',').map(c => c.trim()).filter(Boolean);
    setForm(prev => ({
      ...prev,
      customization_options: [...prev.customization_options, { name: newCustomName, choices, required: false }],
    }));
    setNewCustomName('');
    setNewCustomChoices('');
  };

  const removeCustomization = (idx: number) => {
    setForm(prev => ({ ...prev, customization_options: prev.customization_options.filter((_, i) => i !== idx) }));
  };

  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Menu Manager</h1>
          <p className="text-gray-400">Add and manage your food items</p>
        </div>
        <button
          onClick={openAdd}
          disabled={!restaurant}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold px-4 py-2 rounded-xl text-sm"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      {!restaurant && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-5 flex gap-3">
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-sm">Set up your restaurant first before adding menu items.</p>
        </div>
      )}

      {showForm && (
        <div className="bg-gray-900 rounded-xl p-5 mb-6 border border-gray-700">
          <h3 className="text-white font-semibold mb-4">{editingId ? 'Edit Item' : 'Add Menu Item'}</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Item Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Butter Chicken"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Short description"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Price (₹) *</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                placeholder="299"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Prep Time (min)</label>
              <input
                type="number"
                value={form.preparation_time_minutes}
                onChange={e => setForm(p => ({ ...p, preparation_time_minutes: parseInt(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Image URL</label>
              <input
                value={form.image_url}
                onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="col-span-2 flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_vegetarian} onChange={e => setForm(p => ({ ...p, is_vegetarian: e.target.checked }))} className="w-4 h-4 accent-emerald-500" />
                <span className="text-gray-300 text-sm">Vegetarian</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_vegan} onChange={e => setForm(p => ({ ...p, is_vegan: e.target.checked }))} className="w-4 h-4 accent-emerald-500" />
                <span className="text-gray-300 text-sm">Vegan</span>
              </label>
            </div>
          </div>

          {/* Customizations */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2">Customization Options</p>
            {form.customization_options.map((opt, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 mb-1.5 text-sm">
                <span className="text-white">{opt.name}: <span className="text-gray-400">{opt.choices.join(', ')}</span></span>
                <button onClick={() => removeCustomization(idx)} className="text-gray-500 hover:text-red-400 ml-2"><Trash2 size={13} /></button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input
                value={newCustomName}
                onChange={e => setNewCustomName(e.target.value)}
                placeholder="Option name (e.g., Spice Level)"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-emerald-500"
              />
              <input
                value={newCustomChoices}
                onChange={e => setNewCustomChoices(e.target.value)}
                placeholder="Choices (comma-separated)"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-emerald-500"
              />
              <button onClick={addCustomization} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs">Add</button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.price}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editingId ? 'Update Item' : 'Add Item'}
            </button>
            <button onClick={() => setShowForm(false)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-5 py-2.5 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {Object.keys(groupedItems).length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-700" />
          <p>No menu items yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, catItems]) => (
            <div key={category}>
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">{category}</h3>
              <div className="space-y-2">
                {catItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-gray-900 rounded-xl p-3">
                    <img
                      src={item.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=100'}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {item.is_vegetarian && (
                          <div className="w-3.5 h-3.5 border border-emerald-500 rounded flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                          </div>
                        )}
                        <p className="text-white font-medium text-sm truncate">{item.name}</p>
                      </div>
                      <p className="text-gray-500 text-xs truncate">{item.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-amber-400 font-semibold text-sm">₹{item.price}</p>
                      <p className="text-gray-600 text-xs">{item.preparation_time_minutes}min</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(item)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white bg-gray-800 rounded-lg">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 bg-gray-800 rounded-lg">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
