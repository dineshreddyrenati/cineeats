import { useState } from 'react';
import { Film, UtensilsCrossed, Building2, Eye, EyeOff, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../lib/supabase';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roleOptions: { value: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: 'user', label: 'Movie Goer', icon: <Film size={20} />, desc: 'Book tickets, order food & dining' },
    { value: 'theater_rep', label: 'Theater Partner', icon: <Building2 size={20} />, desc: 'Manage shows, seats & combos' },
    { value: 'restaurant_rep', label: 'Restaurant Partner', icon: <UtensilsCrossed size={20} />, desc: 'Manage menu, orders & tables' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      if (!fullName.trim()) { setError('Full name is required'); setLoading(false); return; }
      const { error } = await signUp(email, password, fullName, role);
      if (error) setError(error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.pexels.com/photos/7991486/pexels-photo-7991486.jpeg?auto=compress&cs=tinysrgb&w=1200"
          alt="Cinema"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950/80 via-gray-900/60 to-amber-900/40" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <Film size={22} className="text-gray-950" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">CineEats</span>
          </div>
          <div>
            <h1 className="text-5xl font-black text-white leading-tight mb-4">
              Movies, Dining,<br />
              <span className="text-amber-400">One Experience.</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              Book your show, pre-order your meal, and arrive to a perfect evening — all from one platform.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: '🎬', label: 'Book Tickets' },
                { icon: '🍽️', label: 'Pre-order Food' },
                { icon: '🎁', label: 'Combo Deals' },
              ].map(item => (
                <div key={item.label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-white text-sm font-medium">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span>Trusted by 50,000+ movie lovers across India</span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <Film size={22} className="text-gray-950" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">CineEats</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-gray-400">
              {mode === 'login' ? 'Sign in to continue' : 'Join the CineEats experience'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-gray-900 rounded-xl p-1 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-amber-500 text-gray-950'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Role selector (register only) */}
          {mode === 'register' && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-400 mb-2">I am a...</label>
              <div className="space-y-2">
                {roleOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      role === opt.value
                        ? 'border-amber-500 bg-amber-500/10 text-white'
                        : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <span className={role === opt.value ? 'text-amber-400' : ''}>{opt.icon}</span>
                    <div>
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className="text-xs opacity-70">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-gray-950 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-amber-400 hover:text-amber-300 font-semibold"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
