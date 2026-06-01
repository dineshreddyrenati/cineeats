import { useEffect, useState } from 'react';
import { Search, Star, Clock, MapPin, Filter, UtensilsCrossed, ShoppingBag } from 'lucide-react';
import { supabase, Restaurant } from '../../lib/supabase';
import RestaurantDetail from './RestaurantDetail';

export default function RestaurantSearch() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [cuisineFilter, setCuisineFilter] = useState('');

  const cuisines = ['All', 'Indian', 'Chinese', 'Italian', 'Fast Food', 'Continental', 'South Indian', 'Desserts'];

  useEffect(() => {
    supabase
      .from('restaurants')
      .select('*')
      .eq('is_active', true)
      .then(({ data }) => {
        setRestaurants(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = restaurants.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase());
    const matchCuisine = !cuisineFilter || cuisineFilter === 'All' || r.cuisine_type.includes(cuisineFilter);
    return matchSearch && matchCuisine;
  });

  if (selected) {
    return <RestaurantDetail restaurant={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Restaurants</h1>
        <p className="text-gray-400">Reserve, pre-order, or pickup from partner restaurants</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search restaurants or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 text-sm transition-colors"
        />
      </div>

      {/* Cuisine filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {cuisines.map(c => (
          <button
            key={c}
            onClick={() => setCuisineFilter(c === 'All' ? '' : c)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              (c === 'All' && !cuisineFilter) || cuisineFilter === c
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-xl h-44 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <UtensilsCrossed size={40} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No restaurants found</p>
          <p className="text-gray-600 text-sm mt-1">
            {restaurants.length === 0
              ? 'Restaurant partners will appear here once they register'
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(r => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-emerald-500/50 transition-all text-left group"
            >
              <div className="relative">
                <img
                  src={r.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600'}
                  alt={r.name}
                  className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {r.is_partner && (
                  <div className="absolute top-2 left-2 bg-amber-500 text-gray-950 text-xs font-bold px-2 py-0.5 rounded-lg">
                    Partner
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between mb-1.5">
                  <h3 className="text-white font-semibold">{r.name}</h3>
                  <div className="flex items-center gap-1 text-amber-400 text-sm flex-shrink-0 ml-2">
                    <Star size={12} className="fill-amber-400" />
                    <span>{r.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-500 text-xs mb-2">
                  <span className="flex items-center gap-1"><MapPin size={10} />{r.city}</span>
                  <span className="flex items-center gap-1"><Clock size={10} />{r.delivery_time_minutes} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {r.cuisine_type.slice(0, 2).map(c => (
                      <span key={c} className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                      <UtensilsCrossed size={10} /> Dine-in
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                      <ShoppingBag size={10} /> Pickup
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
