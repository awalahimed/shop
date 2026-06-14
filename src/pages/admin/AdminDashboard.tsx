import { useEffect, useState } from 'react';
import { Package, ShoppingBag, DollarSign, Clock, TrendingUp, Users } from '@/components/ui/icons';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice, formatDate } from '@/utils/format';
import type { Order } from '@/types';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  pendingOrders: number;
  totalCustomers: number;
  todayRevenue: number;
  recentOrders: Order[];
  topProducts: { name: string; count: number; revenue: number }[];
}

// Simple bar chart using divs
const RevenueBar = ({ label, value, max }: { label: string; value: number; max: number }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-zinc-500 w-8 flex-shrink-0">{label}</span>
    <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-zinc-900 dark:bg-white rounded-full transition-all duration-500"
        style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }}
      />
    </div>
    <span className="text-xs text-zinc-600 dark:text-zinc-400 w-20 text-right flex-shrink-0">
      {formatPrice(value)}
    </span>
  </div>
);

export const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [products, orders, revenue, pending, customers, todayRev, recentOrders, orderItems] =
        await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('total').eq('payment_status', 'paid'),
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('order_status', 'pending'),
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', today.toISOString()),
          supabase.from('orders')
            .select('*, user:users(first_name, last_name)')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase.from('order_items')
            .select('quantity, price, product:products(name)')
            .limit(200),
        ]);

      const totalRevenue = (revenue.data ?? []).reduce(
        (sum: number, o: { total: number }) => sum + Number(o.total), 0,
      );
      const todayRevenue = (todayRev.data ?? []).reduce(
        (sum: number, o: { total: number }) => sum + Number(o.total), 0,
      );

      // Aggregate top products
      const productMap: Record<string, { name: string; count: number; revenue: number }> = {};
      for (const item of (orderItems.data ?? [])) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const name = (item.product as any)?.name ?? 'Unknown';
        if (!productMap[name]) productMap[name] = { name, count: 0, revenue: 0 };
        productMap[name].count += item.quantity;
        productMap[name].revenue += item.price * item.quantity;
      }
      const topProducts = Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setStats({
        totalProducts: products.count ?? 0,
        totalOrders: orders.count ?? 0,
        revenue: totalRevenue,
        pendingOrders: pending.count ?? 0,
        totalCustomers: customers.count ?? 0,
        todayRevenue,
        recentOrders: (recentOrders.data ?? []) as Order[],
        topProducts,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-10"><Spinner className="text-zinc-400" /></div>;
  }

  const s = stats!;
  const maxProductRevenue = s.topProducts[0]?.revenue ?? 1;

  const statCards = [
    { label: 'Total Revenue',   value: formatPrice(s.revenue),      icon: DollarSign,  color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
    { label: "Today's Revenue", value: formatPrice(s.todayRevenue),  icon: TrendingUp,  color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
    { label: 'Total Orders',    value: s.totalOrders,                icon: ShoppingBag, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
    { label: 'Pending Orders',  value: s.pendingOrders,              icon: Clock,       color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' },
    { label: 'Products',        value: s.totalProducts,              icon: Package,     color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' },
    { label: 'Customers',       value: s.totalCustomers,             icon: Users,       color: 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Dashboard</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className={`inline-flex p-2 rounded-xl mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{value}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Top products */}
      {s.topProducts.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white mb-4">Top Products by Revenue</h3>
          <div className="space-y-3">
            {s.topProducts.map((p) => (
              <RevenueBar key={p.name} label={`${p.count}×`} value={p.revenue} max={maxProductRevenue} />
            ))}
            <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
              {s.topProducts.map((p) => (
                <div key={p.name} className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="truncate max-w-[180px]">{p.name}</span>
                  <span>{formatPrice(p.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent orders */}
      {s.recentOrders.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white mb-3">Recent Orders</h3>
          <div className="space-y-2">
            {s.recentOrders.map((order) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const user = (order as any).user;
              return (
                <div key={order.id} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {user?.first_name} {user?.last_name ?? ''}
                    </p>
                    <p className="text-xs text-zinc-400">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{formatPrice(order.total)}</p>
                    <p className={`text-xs ${order.payment_status === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>
                      {order.payment_status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
