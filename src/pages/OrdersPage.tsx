import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardList } from '@/components/ui/icons';
import { useUserOrders } from '@/hooks/useOrders';
import { useUserStore } from '@/store/useUserStore';
import { verifyPayment } from '@/services/payment';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatDate, orderStatusMeta, paymentStatusMeta } from '@/utils/format';
import { haptic } from '@/lib/telegram';
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

const CANCEL_WINDOW_MINUTES = 60;

const canCancel = (order: Order): boolean => {
  if (order.order_status === 'cancelled') return false;
  if (order.order_status === 'shipped' || order.order_status === 'delivered') return false;
  if (order.payment_status !== 'paid') return false; // unpaid orders auto-cancel
  const placed = new Date(order.created_at).getTime();
  const minutesSince = (Date.now() - placed) / 1000 / 60;
  return minutesSince <= CANCEL_WINDOW_MINUTES;
};

const timeLeftToCancel = (order: Order): string => {
  const placed = new Date(order.created_at).getTime();
  const minutesSince = (Date.now() - placed) / 1000 / 60;
  const remaining = Math.max(0, CANCEL_WINDOW_MINUTES - minutesSince);
  if (remaining <= 0) return '';
  const mins = Math.floor(remaining);
  return `${mins}m left to cancel`;
};

const OrderCard = ({ order, onCancel }: { order: Order; onCancel: (id: string) => void }) => {
  const { label: orderLabel } = orderStatusMeta(order.order_status);
  const { label: payLabel }   = paymentStatusMeta(order.payment_status);
  const cancellable = canCancel(order);
  const timeLeft    = cancellable ? timeLeftToCancel(order) : '';

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-3 animate-fadeIn">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-zinc-400">Order ID</p>
          <p className="font-mono text-sm font-medium text-zinc-900 dark:text-white">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-400">{formatDate(order.created_at)}</p>
          <p className="font-bold text-zinc-900 dark:text-white">{formatPrice(order.total)}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge variant={statusToBadge[order.order_status] ?? 'default'}>{orderLabel}</Badge>
        <Badge variant={statusToBadge[order.payment_status] ?? 'default'}>{payLabel}</Badge>
      </div>

      {/* Items */}
      {order.items && order.items.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span className="truncate max-w-[200px]">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(item.product as any)?.name ?? 'Product'} × {item.quantity}
                <span className="ml-1 text-xs text-zinc-400">({item.size})</span>
              </span>
              <span className="flex-shrink-0 ml-2">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Cancel button */}
      {cancellable && (
        <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400">{timeLeft}</p>
            <button
              onClick={() => onCancel(order.id)}
              className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
            >
              Cancel Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const OrdersPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useUserStore((s) => s.user);
  const { orders, loading, error, refetch } = useUserOrders(user?.id);
  const verifiedRef = useRef(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  // Auto-verify payment when Chapa redirects back
  useEffect(() => {
    const txRef = searchParams.get('tx_ref') ?? searchParams.get('trx_ref');
    if (!txRef || verifiedRef.current) return;
    verifiedRef.current = true;
    verifyPayment(txRef)
      .then(() => refetch())
      .catch(() => refetch());
  }, [searchParams, refetch]);

  const handleCancel = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || !canCancel(order)) return;

    haptic.medium();

    setCancelling(orderId);
    try {
      const { error: dbErr } = await supabase
        .from('orders')
        .update({ order_status: 'cancelled' })
        .eq('id', orderId);

      if (dbErr) throw new Error(dbErr.message);
      haptic.success();
      refetch();
    } catch (e) {
      console.error('Cancel failed:', e);
      haptic.error();
    } finally {
      setCancelling(null);
    }
  };

  if (loading || cancelling) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" className="text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-white">My Orders</h1>

      {searchParams.get('tx_ref') && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-center">
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
            ✓ Payment received — your order is being processed
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title="No orders yet"
          description="Your order history will show up here."
          action={<Button variant="primary" onClick={() => navigate('/')}>Start Shopping</Button>}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
};
