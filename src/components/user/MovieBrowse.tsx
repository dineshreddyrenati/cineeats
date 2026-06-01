import { useEffect, useState } from 'react';
import { Search, Clock, Star, Filter, ChevronRight, X } from 'lucide-react';
import { supabase, Movie, Show } from '../../lib/supabase';
import SeatSelector from './SeatSelector';

export default function MovieBrowse() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [genreFilter, setGenreFilter] = useState<string>('');

  const genres = ['All', 'Action', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Romance', 'Musical', 'Thriller'];

  useEffect(() => {
    supabase.from('movies').select('*').eq('is_active', true).then(({ data }) => {
      setMovies(data || []);
      setLoading(false);
    });
  }, []);

  const openMovie = async (movie: Movie) => {
    setSelectedMovie(movie);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate());
    const dateStr = tomorrow.toISOString().split('T')[0];
    const { data } = await supabase
      .from('shows')
      .select('*, theater:theaters(*)')
      .eq('movie_id', movie.id)
      .gte('show_date', dateStr)
      .eq('is_active', true)
      .order('show_date')
      .order('show_time');
    setShows(data || []);
  };

  const filtered = movies.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchGenre = !genreFilter || genreFilter === 'All' || m.genre.includes(genreFilter);
    return matchSearch && matchGenre;
  });

  if (selectedShow) {
    return <SeatSelector show={selectedShow} movie={selectedMovie!} onBack={() => setSelectedShow(null)} />;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Now Showing</h1>
        <p className="text-gray-400">Pick your movie, choose your show</p>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search movies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 text-sm transition-colors"
          />
        </div>
      </div>

      {/* Genre filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {genres.map(g => (
          <button
            key={g}
            onClick={() => setGenreFilter(g === 'All' ? '' : g)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              (g === 'All' && !genreFilter) || genreFilter === g
                ? 'bg-amber-500 text-gray-950'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No movies found</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(movie => (
            <button
              key={movie.id}
              onClick={() => openMovie(movie)}
              className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-amber-500/50 transition-all text-left group"
            >
              <div className="relative">
                <img
                  src={movie.poster_url || 'https://images.pexels.com/photos/1441164/pexels-photo-1441164.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={movie.title}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 bg-gray-950/80 backdrop-blur rounded-lg px-2 py-0.5 text-xs font-medium text-amber-400">
                  {movie.rating}
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-white font-semibold text-sm mb-1 truncate">{movie.title}</h3>
                <div className="flex items-center gap-3 text-gray-500 text-xs">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {movie.duration_minutes}m
                  </span>
                  <span>{movie.language}</span>
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {movie.genre.slice(0, 2).map(g => (
                    <span key={g} className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">{g}</span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img
                src={selectedMovie.poster_url}
                alt={selectedMovie.title}
                className="w-full h-48 object-cover rounded-t-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent rounded-t-2xl" />
              <button
                onClick={() => setSelectedMovie(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-gray-950/70 rounded-full flex items-center justify-center text-white"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-3 left-4">
                <h2 className="text-white text-xl font-bold">{selectedMovie.title}</h2>
                <div className="flex items-center gap-3 text-sm text-gray-300 mt-1">
                  <span className="flex items-center gap-1"><Clock size={13} />{selectedMovie.duration_minutes}m</span>
                  <span>{selectedMovie.language}</span>
                  <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs font-medium">{selectedMovie.rating}</span>
                </div>
              </div>
            </div>

            <div className="p-4">
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">{selectedMovie.description}</p>

              <h3 className="text-white font-semibold mb-3">Available Shows</h3>
              {shows.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No upcoming shows found</p>
              ) : (
                <div className="space-y-2">
                  {shows.map(show => (
                    <button
                      key={show.id}
                      onClick={() => { setSelectedShow(show); setSelectedMovie(null); }}
                      className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 rounded-xl p-3 transition-all"
                    >
                      <div className="text-left">
                        <p className="text-white font-medium text-sm">{show.theater?.name}</p>
                        <p className="text-gray-400 text-xs">{show.theater?.city} • Screen {show.screen_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-400 font-semibold text-sm">{show.show_time.slice(0, 5)}</p>
                        <p className="text-gray-400 text-xs">{new Date(show.show_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        <p className="text-emerald-400 text-xs mt-0.5">{show.available_seats} seats left</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-500 ml-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
