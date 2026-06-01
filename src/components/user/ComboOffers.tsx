import { useEffect, useState } from 'react';
import { Gift, Building2, UtensilsCrossed, Percent, Users, Calendar, Search, MapPin } from 'lucide-react';
import { supabase, ComboDeal, Theater, Restaurant } from '../../lib/supabase';

interface Props {
  onBack: () => void;
  onApplyCombo?: (combo: ComboDeal) => void;
  selectedTheaterId?: string;
}

export default function ComboOffers({ onBack, onApplyCombo, selectedTheaterId }: Props) {
  const [combos, setCombos] = useState<ComboDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'theater' | 'restaurant'>('all');
  const [filterPartner, setFilterPartner] = useState('');

  useEffect(() => {
    loadCombos();
  }, []);

  const loadCombos = async () => {
    const { data } = await supabase
      .from('combo_deals')
      .select('*, theater:theaters(*), restaurant:restaurants(*)')
      .eq('is_active', true)
      .eq('theater_approved', true)
      .eq('restaurant_approved', true)
      .gte('valid_until', new Date().toISOString().split('T')[0])
      .order('discount_percentage', { ascending: false });
    setCombos(data || []);
    setLoading(false);
  };

  const filteredCombos = combos.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.theater?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.restaurant?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterBy === 'all' || filterPartner === '' ||
      (filterBy === 'theater' && c.theater_id === filterPartner) ||
      (filterBy === 'restaurant' && c.restaurant_id === filterPartner);
    return matchSearch && matchFilter;
  });

  // Group by theater for "By Theater" view
  const groupedByTheater = filteredCombos.reduce((acc, combo) => {
    const theaterId = combo.theater_id;
    if (!acc[theaterId]) {
      acc[theaterId] = { theater: combo.theater, combos: [] };
    }
    acc[theaterId].combos.push(combo);
    return acc;
  }, {} as Record<string, { theater: Theater; combos: ComboDeal[] }>);

  // Group by restaurant for "By Restaurant" view
  const groupedByRestaurant = filteredCombos.reduce((acc, combo) => {
    const restaurantId = combo.restaurant_id;
    if (!acc[restaurantId]) {
      acc[restaurantId] = { restaurant: combo.restaurant, combos: [] };
    }
    acc[restaurantId].combos.push(combo);
    return acc;
  }, {} as Record<string, { restaurant: Restaurant; combos: ComboDeal[] }>);

  const theaterPartners = combos.reduce((acc, c) => {
    if (!acc.find(t => t.id === c.theater_id)) acc.push(c.theater);
    return acc;
  }, [] as Theater[]);

  const restaurantPartners = combos.reduce((acc, c) => {
    if (!acc.find(r => r.id === c.restaurant_id)) acc.push(c.restaurant);
    return acc;
  }, [] as Restaurant[]);

  // Group by partnership (unique theater-restaurant combinations)
  const groupedByPartnership = filteredCombos.reduce((acc, combo) => {
    const key = `${combo.theater_id}-${combo.restaurant_id}`;
    if (!acc[key]) {
      acc[key] = { theater: combo.theater, restaurant: combo.restaurant, combos: [] };
    }
    acc[key].combos.push(combo);
    return acc;
  }, {} as Record<string, { theater: Theater; restaurant: Restaurant; combos: ComboDeal[] }>);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Combo Offers</h1>
          <p className="text-gray-400">Exclusive deals from our theater & restaurant partners</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or theater..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 text-sm"
          />
        </div>
        <select
          value={filterBy}
          onChange={e => { setFilterBy(e.target.value as any); setFilterPartner(''); }}
          className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white text-sm"
        >
          <option value="all">All Offers</option>
          <option value="partnership">By Partnership</option>
          <option value="theater">By Theater</option>
          <option value="restaurant">By Restaurant</option>
        </select>
        {filterBy === 'theater' && (
          <select
            value={filterPartner}
            onChange={e => setFilterPartner(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white text-sm"
          >
            <option value="">All Theaters</option>
            {theaterPartners.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
        {filterBy === 'restaurant' && (
          <select
            value={filterPartner}
            onChange={e => setFilterPartner(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white text-sm"
          >
            <option value="">All Restaurants</option>
            {restaurantPartners.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-900 rounded-xl h-44 animate-pulse" />)}
        </div>
      ) : filteredCombos.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Gift size={40} className="mx-auto mb-3 text-gray-700" />
          <p>No combo offers found</p>
          <p className="text-sm text-gray-600 mt-1">Check back soon for new deals!</p>
        </div>
      ) : filterBy === 'partnership' ? (
        // Group by Partnership
        <div className="space-y-6">
          {Object.entries(groupedByPartnership).map(([key, { theater, restaurant, combos }]) => (
            <div key={key} className="bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Building2 size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{theater?.name}</p>
                      <p className="text-gray-500 text-xs">{theater?.city}</p>
                    </div>
                  </div>
                  <div className="text-gray-600 text-xl">×</div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <UtensilsCrossed size={18} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{restaurant?.name}</p>
                      <p className="text-gray-500 text-xs">{restaurant?.cuisine_type?.join(', ')}</p>
                    </div>
                  </div>
                </div>
                <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-lg text-xs font-semibold">{combos.length} {combos.length === 1 ? 'offer' : 'offers'}</span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {combos.map(combo => (
                  <div key={combo.id} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-white font-semibold text-sm">{combo.title}</p>
                      <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Percent size={12} /> {combo.discount_percentage}%
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mb-3">{combo.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Users size={10} /> {combo.min_ticket_count}+ tickets</span>
                      <span className="flex items-center gap-1"><Calendar size={10} /> Till {new Date(combo.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filterBy === 'theater' ? (
        // Group by Theater
        <div className="space-y-6">
          {Object.entries(groupedByTheater).map(([id, { theater, combos }]) => (
            <div key={id}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Building2 size={18} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{theater?.name}</h3>
                  <p className="text-gray-500 text-xs flex items-center gap-1"><MapPin size={10} /> {theater?.city}</p>
                </div>
                <span className="ml-auto text-amber-400 text-sm font-medium">{combos.length} deals</span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {combos.slice(0, 2).map(combo => (
                  <div key={combo.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold">{combo.title}</p>
                        <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                          <UtensilsCrossed size={10} /> {combo.restaurant?.name}
                        </p>
                      </div>
                      <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                        <Percent size={12} /> {combo.discount_percentage}% OFF
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mb-3">{combo.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Users size={10} /> {combo.min_ticket_count}+ tickets</span>
                      <span className="flex items-center gap-1"><Calendar size={10} /> Till {new Date(combo.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <p className="text-gray-600 text-xs mt-2">Split: Theater {combo.commission_split.theater}% | Restaurant {combo.commission_split.restaurant}%</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filterBy === 'restaurant' ? (
        // Group by Restaurant
        <div className="space-y-6">
          {Object.entries(groupedByRestaurant).map(([id, { restaurant, combos }]) => (
            <div key={id}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <UtensilsCrossed size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{restaurant?.name}</h3>
                  <p className="text-gray-500 text-xs">{restaurant?.cuisine_type?.join(', ')}</p>
                </div>
                <span className="ml-auto text-amber-400 text-sm font-medium">{combos.length} deals</span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {combos.slice(0, 2).map(combo => (
                  <div key={combo.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold">{combo.title}</p>
                        <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                          <Building2 size={10} /> {combo.theater?.name}
                        </p>
                      </div>
                      <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                        <Percent size={12} /> {combo.discount_percentage}% OFF
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mb-3">{combo.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Users size={10} /> {combo.min_ticket_count}+ tickets</span>
                      <span className="flex items-center gap-1"><Calendar size={10} /> Till {new Date(combo.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Grid view
        <div className="grid md:grid-cols-2 gap-4">
          {filteredCombos.map(combo => (
            <div key={combo.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-amber-500/30 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white font-bold text-lg">{combo.title}</p>
                  <p className="text-gray-400 text-sm mt-1">{combo.description}</p>
                </div>
                <span className="bg-emerald-500 text-white px-3 py-1 rounded-lg font-bold text-sm flex items-center gap-1">
                  <Percent size={12} /> {combo.discount_percentage}% OFF
                </span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-blue-400" />
                  <span className="text-gray-300 text-sm">{combo.theater?.name}</span>
                </div>
                <span className="text-gray-600">+</span>
                <div className="flex items-center gap-2">
                  <UtensilsCrossed size={14} className="text-emerald-400" />
                  <span className="text-gray-300 text-sm">{combo.restaurant?.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1"><Users size={12} /> Min {combo.min_ticket_count} tickets</span>
                <span className="flex items-center gap-1"><Calendar size={12} /> Valid till {new Date(combo.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>

              <div className="border-t border-gray-800 pt-3 flex items-center justify-between">
                <div className="text-xs">
                  <p className="text-gray-500">Revenue Split</p>
                  <p className="text-gray-300">Theater: <span className="text-blue-400 font-medium">{combo.commission_split.theater}%</span> | Restaurant: <span className="text-emerald-400 font-medium">{combo.commission_split.restaurant}%</span></p>
                </div>
                <span className="text-xs text-gray-600 capitalize bg-gray-800 px-2 py-1 rounded">{combo.offer_type.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
