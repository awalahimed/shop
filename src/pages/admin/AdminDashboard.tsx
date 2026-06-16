import { useEffect, useState } from 'react';
import { Package, ShoppingBag, DollarSign, Clock, TrendingUp, Users } from '@/components/ui/icons';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice } from '@/utils/format';
import type { Order } from '@/types';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  pendingOrders: number;
  totalCustomers: number;
  todayRevenue: number;
  paidOrders: number;
  cancelledOrders: number;
  recentOrders: Order[];
  topProducts: { name: string; count: number; revenue: number }[];
}

const StatCard = ({
  label, value, sub, icon: Icon, accent,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.FC<{ size?: number; className?: string }>;
  accent: string;
}) => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</span>
      <div className={`p-2 rounded-lg ${accent}`}>
        <Icon size={14} />
      </div>
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// Semicircle gauge
const Gauge = ({ value, max, label, sub }: { value: number; max: number; label: string; sub: string }) => {
  const pct = Math.min(value / Math.max(max, 1), 1);
  const r = 40;
  const cx = 56, cy = 56;
  const circumference = Math.PI * r; // half circle
  const dash = circumference * pct;

  return (
    <div className="flex flex-col items-center">
      <svg width="112" height="64" viewBox="0 0 112 64">
        {/* Background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#27272a" strokeWidth="8" strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <p className="text-xl font-bold text-white -mt-4">{label}</p>
      <p className="text-xs text-zinc-500">{sub}</p>
    </div>
  );
};

export const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);

      const [products, orders, allOrders, paidOrders, cancelledOrders, pending, customers,
        todayRev, recentOrders, orderItems] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total').eq('payment_status', 'paid'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('order_status', 'cancelled'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('order_status', 'pending'),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', today.toISOString()),
        supabase.from('orders').select('*, user:users(first_name,last_name,username)').order('created_at', { ascending: false }).limit(8),
        supabase.from('order_items').select('quantity,price,product:products(name)').limit(200),
      ]);

      const revenue = (allOrders.data ?? []).reduce((s, o) => s + Number(o.total), 0);
      const todayRevenue = (todayRev.data ?? []).reduce((s, o) => s + Number(o.total), 0);

      const productMap: Record<string, { name: string; count: number; revenue: number }> = {};
      for (const item of (orderItems.data ?? [])) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const name = (item.product as any)?.name ?? 'Unknown';
        if (!productMap[name]) productMap[name] = { name, count: 0, revenue: 0 };
        productMap[name].count += item.quantity;
        productMap[name].revenue += item.price * item.quantity;
      }
      const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      setStats({
        totalProducts: products.count ?? 0,
        totalOrders: orders.count ?? 0,
        revenue,
        pendingOrders: pending.count ?? 0,
        totalCustomers: customers.count ?? 0,
        todayRevenue,
        paidOrders: paidOrders.count ?? 0,
        cancelledOrders: cancelledOrders.count ?? 0,
        recentOrders: (recentOrders.data ?? []) as Order[],
        topProducts,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="text-zinc-600" size="lg" />
      </div>
    );
  }

  const s = stats!;
  const total = s.totalOrders || 1;
  const paidPct   = Math.round((s.paidOrders / total) * 100);
  const cancelPct = Math.round((s.cancelledOrders / total) * 100);
  const pendingPct = Math.round((s.pendingOrders / total) * 100);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Welcome back — here's what's happening</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Revenue"    value={formatPrice(s.revenue)}      sub={`${s.totalOrders} orders`}    icon={DollarSign}  accent="bg-green-900/40 text-green-400" />
        <StatCard label="Today's Revenue"  value={formatPrice(s.todayRevenue)} sub="vs yesterday"                 icon={TrendingUp}   accent="bg-blue-900/40 text-blue-400" />
        <StatCard label="Pending Orders"   value={s.pendingOrders}             sub="need processing"              icon={Clock}        accent="bg-yellow-900/40 text-yellow-400" />
        <StatCard label="Total Orders"     value={s.totalOrders}               sub="all time"                     icon={ShoppingBag}  accent="bg-purple-900/40 text-purple-400" />
        <StatCard label="Products"         value={s.totalProducts}             sub="in catalog"                   icon={Package}      accent="bg-orange-900/40 text-orange-400" />
        <StatCard label="Customers"        value={s.totalCustomers}            sub="registered"                   icon={Users}        accent="bg-pink-900/40 text-pink-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent orders table */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm">Recent Orders</h2>
            <span className="text-xs text-zinc-500">{s.recentOrders.length} latest</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-5 py-3 text-xs text-zinc-500 font-medium">Order</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Customer</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Amount</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {s.recentOrders.map((order) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const user = (order as any).user;
                  return (
                    <tr key={order.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-zinc-400 text-xs">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-3 py-3 text-zinc-300">
                        {user?.first_name} {user?.last_name ?? ''}
                      </td>
                      <td className="px-3 py-3 text-white font-medium">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          order.payment_status === 'paid'
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-yellow-900/50 text-yellow-400'
                        }`}>
                          {order.payment_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Revenue gauge */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Revenue Overview</p>
            <div className="flex justify-center">
              <Gauge
                value={s.revenue}
                max={s.revenue * 1.5 || 1}
                label={formatPrice(s.revenue)}
                sub={`${s.totalOrders} orders`}
              />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Today</span>
                <span className="text-white font-medium">{formatPrice(s.todayRevenue)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Average/order</span>
                <span className="text-white font-medium">
                  {formatPrice(s.totalOrders > 0 ? s.revenue / s.totalOrders : 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Order status breakdown */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Orders Status</p>
            <div className="space-y-3">
              {[
                { label: 'Paid',      pct: paidPct,    color: 'bg-green-500',  count: s.paidOrders },
                { label: 'Pending',   pct: pendingPct, color: 'bg-yellow-500', count: s.pendingOrders },
                { label: 'Cancelled', pct: cancelPct,  color: 'bg-red-500',    count: s.cancelledOrders },
              ].map(({ label, pct, color, count }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">{label}</span>
                    <span className="text-zinc-300">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top products */}
          {s.topProducts.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Top Products</p>
              <div className="space-y-2">
                {s.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600 w-4">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 truncate">{p.name}</p>
                      <p className="text-[10px] text-zinc-600">{p.count} sold</p>
                    </div>
                    <span className="text-xs text-white font-medium flex-shrink-0">{formatPrice(p.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
