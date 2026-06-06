import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/useUserStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);

  const [telegramId, setTelegramId] = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);

  // Simple admin password — store this in Vercel env as VITE_ADMIN_PASSWORD
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'union-admin-2024';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== ADMIN_PASSWORD) {
      setError('Incorrect password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', parseInt(telegramId))
        .eq('is_admin', true)
        .single();

      if (dbError || !data) {
        setError('No admin account found for that Telegram ID.');
        return;
      }

      setUser(data);
      navigate('/admin');
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-zinc-900 dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white dark:text-zinc-900 text-2xl font-bold">U</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Union Admin</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Sign in to manage your store</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-4"
        >
          <Input
            label="Telegram ID"
            type="number"
            placeholder="e.g. 5295611655"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            required
          />

          <Input
            label="Admin Password"
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Sign In
          </Button>
        </form>

        <p className="text-center text-xs text-zinc-400 mt-4">
          Only authorized admins can access this panel.
        </p>
      </div>
    </div>
  );
};
