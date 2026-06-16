import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllOrders, updateOrderStatus } from '@/services/orders';
import { Spinner } from '@/components/ui/Spinner';
import { Search, Eye, X } from '@/components/ui/icons';
import { formatPrice, formatDate } from '@/utils/format';
import type { Order } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-900/40 text-yellow-400',
  processing: 'bg-blue-900/40 text-blue-400',
  shipped:    'bg-indigo-900/40 text-indigo-400',
  delivered:  'bg-green-900/40 text-green-400',
  cancelled:  'bg-red-900/40 text-red-400',
  paid:       'bg-green-900/40 text-green-400',
  failed:     'bg-red-900/40 text-red-400',
};

const ORDER_STATUSES: Order['order_status'][] = ['pending','processing','shipped','delivered','cancelled'];

export const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    const data = await getAllOrders().catch(() => []);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (o as any).user;
      const name = `${user?.first_name ?? ''} ${user?.last_name ?? ''} ${user?.username ?? ''}`.toLowerCase();
      const matchSearch = !search || name.includes(search.toLowerCase()) || o.id.includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || o.order_status === statusFilter;
      const matchPayment = paymentFilter === 'all' || o.payment_status === paymentFilter;
      return matchSearch && matchStatus && matchPayment;
    });
  }, [orders, search, statusFilter, paymentFilter]);

  const handleStatusChange = async (orderId: string, status: Order['order_status']) => {
    setUpdating(orderId);
    await updateOrderStatus(orderId, status).catch(console.error);
    setUpdating(null);
    load();
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{filtered.length} of {orders.length} orders</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, customers…"
            className="w-full pl-9 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by order status"
          className="bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600"
        >
          <option value="all">All Statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Payment filter */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          aria-label="Filter by payment status"
          className="bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600"
        >
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Unpaid</option>
          <option value="failed">Failed</option>
        </select>

        {(statusFilter !== 'all' || paymentFilter !== 'all' || search) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); setPaymentFilter('all'); }}
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner className="text-zinc-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-600">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-5 py-3 text-xs text-zinc-500 font-medium">Order ID</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Customer</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Date</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Total</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Payment</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Status</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Update</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const user = (order as any).user;
                  return (
                    <tr key={order.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                      <td className="px-5 py-3 font-mono text-zinc-400 text-xs">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <p className="text-zinc-200 font-medium">
                            {user?.first_name} {user?.last_name ?? ''}
                          </p>
                          {user?.username && (
                            <p className="text-zinc-600 text-xs">@{user.username}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-zinc-500 text-xs whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-3 py-3 text-white font-semibold">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[order.payment_status] ?? 'bg-zinc-800 text-zinc-400'}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[order.order_status] ?? 'bg-zinc-800 text-zinc-400'}`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={order.order_status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as Order['order_status'])}
                            disabled={updating === order.id}
                            aria-label="Update order status"
                            className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-zinc-500"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          {updating === order.id && <Spinner size="sm" className="text-zinc-500" />}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          aria-label="View order details"
                          className="p-1.5 text-zinc-600 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
