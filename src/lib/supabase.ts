import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Log clearly in console what's happening with env vars
if (!supabaseUrl || supabaseUrl === 'undefined') {
  console.error('❌ VITE_SUPABASE_URL is missing. Add it to Vercel → Settings → Environment Variables and redeploy.');
}
if (!supabaseAnonKey || supabaseAnonKey === 'undefined') {
  console.error('❌ VITE_SUPABASE_ANON_KEY is missing. Add it to Vercel → Settings → Environment Variables and redeploy.');
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);

/** Quick connectivity test — call from browser console: testSupabase() */
(window as Window & { testSupabase?: () => void }).testSupabase = async () => {
  console.log('Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  const { data, error } = await supabase.from('products').select('count').single();
  if (error) console.error('❌ Supabase error:', error.message);
  else console.log('✅ Supabase connected. Products count:', data);
};
