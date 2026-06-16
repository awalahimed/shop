import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice, formatDate } from '@/utils/format';

interface CustomerRow {
  id: string;
  telegram_id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  created_at: string;
  order_count: number;
  total_spent: number;
  last_order_date: string | null;
}

export const AdminCustomers = () => {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: users } = await supabase
        .from('users')
        .select('id, telegram_id, first_name, last_name, username, created_at')
        .order('created_at', { ascending: false });

      if (!users?.length) { setLoading(false); return; }

      const { data: orders } = await supabase
        .from('orders').select('user_id, total, created_at').eq('payment_status', 'paid');

      const statsMap: Record<string, { count: number; spent: number; lastDate: string | null }> = {};
      for (const o of (orders ?? [])) {
        if (!statsMap[o.user_id]) statsMap[o.user_id] = { count: 0, spent: 0, lastDate: null };
        statsMap[o.user_id].count += 1;
        statsMap[o.user_id].spent += Number(o.total);
        if (!statsMap[o.user_id].lastDate || o.created_at > statsMap[o.user_id].lastDate!)
          statsMap[o.user_id].lastDate = o.created_at;
      }

      const rows: CustomerRow[] = users.map((u) => ({
        ...u,
        order_count: statsMap[u.id]?.count ?? 0,
        total_spent: statsMap[u.id]?.spent ?? 0,
        last_order_date: statsMap[u.id]?.lastDate ?? null,
      })).sort((a, b) => b.total_spent - a.total_spent);

      setCustomers(rows);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner className="text-zinc-600" /></div>;
  }

  const rankColor = (i: number) =>
    i === 0 ? 'bg-yellow-900/50 text-yellow-400' :
    i === 1 ? 'bg-zinc-700 text-zinc-300' :
    i === 2 ? 'bg-orange-900/50 text-orange-400' :
    'bg-zinc-800 text-zinc-600';

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{customers.length} registered customers</p>
      </div>

      {customers.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-600">
          No customers yet. They will appear after first app open.
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-5 py-3 text-xs text-zinc-500 font-medium">Rank</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Customer</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Telegram</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Orders</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Total Spent</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Last Order</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                    <td className="px-5 py-3">
                      <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold ${rankColor(i)}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-zinc-200 font-medium">{c.first_name} {c.last_name ?? ''}</p>
                      <p className="text-zinc-600 text-xs">ID: {c.telegram_id}</p>
                    </td>
                    <td className="px-3 py-3 text-zinc-500 text-xs">
                      {c.username ? `@${c.username}` : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-sm font-semibold ${c.order_count > 0 ? 'text-white' : 'text-zinc-600'}`}>
                        {c.order_count}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-sm font-semibold ${c.total_spent > 0 ? 'text-green-400' : 'text-zinc-600'}`}>
                        {c.total_spent > 0 ? formatPrice(c.total_spent) : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-zinc-500 text-xs">
                      {c.last_order_date ? formatDate(c.last_order_date) : '—'}
                    </td>
                    <td className="px-3 py-3 text-zinc-500 text-xs">
                      {formatDate(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
