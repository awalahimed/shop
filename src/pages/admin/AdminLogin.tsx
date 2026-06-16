import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/useUserStore';
import { ShoppingBag } from '@/components/ui/icons';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);
  const [telegramId, setTelegramId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'union-admin-2024';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== ADMIN_PASSWORD) { setError('Incorrect password.'); return; }
    setLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from('users').select('*')
        .eq('telegram_id', parseInt(telegramId))
        .eq('is_admin', true).single();
      if (dbError || !data) { setError('No admin account found for that Telegram ID.'); return; }
      setUser(data);
      navigate('/admin');
    } catch { setError('Login failed. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={22} className="text-zinc-900" />
          </div>
          <h1 className="text-2xl font-bold text-white">Union Admin</h1>
          <p className="text-sm text-zinc-500 mt-1">Sign in to manage your store</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Telegram ID</label>
            <input
              type="number"
              placeholder="e.g. 5295611655"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</label>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-2.5">
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-zinc-900 font-semibold py-3 rounded-xl text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            ) : null}
            Sign In
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-4">
          Only authorized admins can access this panel
        </p>
      </div>
    </div>
  );
};
