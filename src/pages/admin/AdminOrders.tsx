import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllOrders, updateOrderStatus } from '@/services/orders';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Eye } from '@/components/ui/icons';
import { formatPrice, formatDate, orderStatusMeta, paymentStatusMeta } from '@/utils/format';
import type { Order } from '@/types';

const ORDER_STATUSES: Order['order_status'][] = [
  'pending', 'processing', 'shipped', 'delivered', 'cancelled',
];

const statusToBadge: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending:    'warning',
  processing: 'info',
  shipped:    'info',
  delivered:  'success',
  cancelled:  'danger',
  paid:       'success',
  failed:     'danger',
};

export const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await getAllOrders().catch(() => []);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (orderId: string, status: Order['order_status']) => {
    setUpdating(orderId);
    await updateOrderStatus(orderId, status).catch(console.error);
    setUpdating(null);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Spinner className="text-zinc-400" /></div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Orders ({orders.length})</h2>

      <div className="space-y-3">
        {orders.map((order) => {
          const { label: orderLabel } = orderStatusMeta(order.order_status);
          const { label: payLabel }   = paymentStatusMeta(order.payment_status);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const user = (order as any).user;

          return (
            <div
              key={order.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start text-sm">
                <div>
                  <p className="font-mono font-medium text-zinc-900 dark:text-white">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  {user && (
                    <p className="text-zinc-400 text-xs">
                      {user.first_name} {user.last_name ?? ''} {user.username ? `@${user.username}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-right">
                    <p className="font-bold text-zinc-900 dark:text-white">{formatPrice(order.total)}</p>
                    <p className="text-zinc-400 text-xs">{formatDate(order.created_at)}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    aria-label="View order details"
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Badge variant={statusToBadge[order.order_status] ?? 'default'}>{orderLabel}</Badge>
                <Badge variant={statusToBadge[order.payment_status] ?? 'default'}>{payLabel}</Badge>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-500 flex-shrink-0">Update status:</label>
                <select
                  value={order.order_status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value as Order['order_status'])}
                  disabled={updating === order.id}
                  aria-label="Update order status"
                  className="flex-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-700 dark:text-zinc-300 px-2 py-1.5 focus:outline-none"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {updating === order.id && <Spinner size="sm" className="text-zinc-400" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ORDER_STATUSES: Order['order_status'][] = [
  'pending', 'processing', 'shipped', 'delivered', 'cancelled',
];

const statusToBadge: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending:    'warning',
  processing: 'info',
  shipped:    'info',
  delivered:  'success',
  cancelled:  'danger',
  paid:       'success',
  failed:     'danger',
};

export const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await getAllOrders().catch(() => []);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (orderId: string, status: Order['order_status']) => {
    setUpdating(orderId);
    await updateOrderStatus(orderId, status).catch(console.error);
    setUpdating(null);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Spinner className="text-zinc-400" /></div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Orders ({orders.length})</h2>

      <div className="space-y-3">
        {orders.map((order) => {
          const { label: orderLabel } = orderStatusMeta(order.order_status);
          const { label: payLabel }   = paymentStatusMeta(order.payment_status);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const user = (order as any).user;

          return (
            <div
              key={order.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start text-sm">
                <div>
                  <p className="font-mono font-medium text-zinc-900 dark:text-white">
                    #{order.id.slice(0, 8)}
                  </p>
                  {user && (
                    <p className="text-zinc-400 text-xs">
                      {user.first_name} {user.last_name ?? ''} {user.username ? `@${user.username}` : ''}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-zinc-900 dark:text-white">{formatPrice(order.total)}</p>
                  <p className="text-zinc-400 text-xs">{formatDate(order.created_at)}</p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Badge variant={statusToBadge[order.order_status] ?? 'default'}>{orderLabel}</Badge>
                <Badge variant={statusToBadge[order.payment_status] ?? 'default'}>{payLabel}</Badge>
              </div>

              {/* Status update */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-500 flex-shrink-0">Update status:</label>
                <select
                  value={order.order_status}
                  onChange={(e) =>
                    handleStatusChange(order.id, e.target.value as Order['order_status'])
                  }
                  disabled={updating === order.id}
                  aria-label="Update order status"
                  className="flex-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-700 dark:text-zinc-300 px-2 py-1.5 focus:outline-none"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {updating === order.id && <Spinner size="sm" className="text-zinc-400" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
