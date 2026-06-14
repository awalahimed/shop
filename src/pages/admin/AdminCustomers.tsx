import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice, formatDate } from '@/utils/format';
import { Users } from '@/components/ui/icons';
import { EmptyState } from '@/components/ui/EmptyState';

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
      // Fetch users with their order aggregates
      const { data: users } = await supabase
        .from('users')
        .select('id, telegram_id, first_name, last_name, username, created_at')
        .order('created_at', { ascending: false });

      if (!users?.length) { setLoading(false); return; }

      // Fetch order stats per user
      const { data: orders } = await supabase
        .from('orders')
        .select('user_id, total, created_at')
        .eq('payment_status', 'paid');

      // Aggregate
      const statsMap: Record<string, { count: number; spent: number; lastDate: string | null }> = {};
      for (const o of (orders ?? [])) {
        if (!statsMap[o.user_id]) statsMap[o.user_id] = { count: 0, spent: 0, lastDate: null };
        statsMap[o.user_id].count += 1;
        statsMap[o.user_id].spent += Number(o.total);
        if (!statsMap[o.user_id].lastDate || o.created_at > statsMap[o.user_id].lastDate!) {
          statsMap[o.user_id].lastDate = o.created_at;
        }
      }

      const rows: CustomerRow[] = users.map((u) => ({
        ...u,
        order_count: statsMap[u.id]?.count ?? 0,
        total_spent: statsMap[u.id]?.spent ?? 0,
        last_order_date: statsMap[u.id]?.lastDate ?? null,
      }));

      // Sort by total spent descending
      rows.sort((a, b) => b.total_spent - a.total_spent);

      setCustomers(rows);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-10"><Spinner className="text-zinc-400" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          Customers ({customers.length})
        </h2>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No customers yet"
          description="Customers will appear here after they open your shop."
        />
      ) : (
        <div className="space-y-2">
          {customers.map((c, i) => (
            <div
              key={c.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm"
            >
              <div className="flex items-start gap-3">
                {/* Rank badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i === 0 ? 'bg-yellow-100 text-yellow-700' :
                  i === 1 ? 'bg-zinc-100 text-zinc-600' :
                  i === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-zinc-50 text-zinc-400 dark:bg-zinc-800'
                }`}>
                  #{i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm text-zinc-900 dark:text-white">
                        {c.first_name} {c.last_name ?? ''}
                      </p>
                      {c.username && (
                        <p className="text-xs text-zinc-400">@{c.username}</p>
                      )}
                      <p className="text-xs text-zinc-400">ID: {c.telegram_id}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">
                        {formatPrice(c.total_spent)}
                      </p>
                      <p className="text-xs text-zinc-400">spent</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>
                      {c.order_count} order{c.order_count !== 1 ? 's' : ''}
                    </span>
                    {c.last_order_date && (
                      <span>Last: {formatDate(c.last_order_date)}</span>
                    )}
                    <span>Joined: {formatDate(c.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
