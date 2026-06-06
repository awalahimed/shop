import { useNavigate } from 'react-router-dom';
import { ClipboardList } from '@/components/ui/icons';
import { useUserOrders } from '@/hooks/useOrders';
import { useUserStore } from '@/store/useUserStore';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatDate, orderStatusMeta, paymentStatusMeta } from '@/utils/format';
import type { Order } from '@/types';

const statusToBadge: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending:    'warning',
  processing: 'info',
  shipped:    'info',
  delivered:  'success',
  cancelled:  'danger',
  paid:       'success',
  failed:     'danger',
};

const OrderCard = ({ order }: { order: Order }) => {
  const { label: orderLabel } = orderStatusMeta(order.order_status);
  const { label: payLabel }   = paymentStatusMeta(order.payment_status);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-3 animate-fadeIn">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-zinc-400">Order</p>
          <p className="font-mono text-sm font-medium text-zinc-900 dark:text-white truncate max-w-[160px]">
            #{order.id.slice(0, 8)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-400">{formatDate(order.created_at)}</p>
          <p className="font-bold text-zinc-900 dark:text-white">{formatPrice(order.total)}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge variant={statusToBadge[order.order_status] ?? 'default'}>
          {orderLabel}
        </Badge>
        <Badge variant={statusToBadge[order.payment_status] ?? 'default'}>
          {payLabel}
        </Badge>
      </div>

      {/* Items summary */}
      {order.items && order.items.length > 0 && (
        <div className="space-y-1">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>{item.product?.name ?? 'Product'} × {item.quantity} ({item.size})</span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const OrdersPage = () => {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const { orders, loading, error } = useUserOrders(user?.id);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" className="text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Orders</h1>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title="No orders yet"
          description="Your order history will show up here."
          action={
            <Button variant="primary" onClick={() => navigate('/')}>
              Start Shopping
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};
