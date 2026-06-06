import { useEffect, useState } from 'react';
import { Package, ShoppingBag, DollarSign, Clock } from '@/components/ui/icons';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice } from '@/utils/format';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  pendingOrders: number;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [products, orders, revenue, pending] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total').eq('payment_status', 'paid'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('order_status', 'pending'),
      ]);

      const totalRevenue = (revenue.data ?? []).reduce(
        (sum: number, o: { total: number }) => sum + o.total,
        0,
      );

      setStats({
        totalProducts: products.count ?? 0,
        totalOrders: orders.count ?? 0,
        revenue: totalRevenue,
        pendingOrders: pending.count ?? 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="text-zinc-400" />
      </div>
    );
  }

  const cards = [
    { label: 'Products',       value: stats?.totalProducts ?? 0,      icon: Package,     color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
    { label: 'Total Orders',   value: stats?.totalOrders ?? 0,        icon: ShoppingBag, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
    { label: 'Revenue',        value: formatPrice(stats?.revenue ?? 0), icon: DollarSign, color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
    { label: 'Pending Orders', value: stats?.pendingOrders ?? 0,       icon: Clock,       color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Dashboard</h2>
      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm"
          >
            <div className={`inline-flex p-2 rounded-xl mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
