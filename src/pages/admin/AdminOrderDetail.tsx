import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from '@/components/ui/icons';
import { supabase } from '@/lib/supabase';
import { updateOrderStatus } from '@/services/orders';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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

// Timeline step
const TimelineStep = ({ label, active, done }: { label: string; active: boolean; done: boolean }) => (
  <div className="flex flex-col items-center gap-1">
    <div className={`w-3 h-3 rounded-full border-2 transition-colors ${
      done ? 'bg-zinc-900 border-zinc-900 dark:bg-white dark:border-white' :
      active ? 'bg-white border-zinc-900 dark:bg-zinc-950 dark:border-white' :
      'bg-zinc-100 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700'
    }`} />
    <span className={`text-[10px] text-center leading-tight ${
      done || active ? 'text-zinc-900 dark:text-white font-medium' : 'text-zinc-400'
    }`}>{label}</span>
  </div>
);

export const AdminOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        user:users(id, first_name, last_name, username, telegram_id),
        items:order_items(id, size, quantity, price, product:products(id, name, image_url))
      `)
      .eq('id', id)
      .single();
    setOrder(data as Order);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleStatus = async (status: Order['order_status']) => {
    if (!order) return;
    setUpdating(true);
    await updateOrderStatus(order.id, status);
    setUpdating(false);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Spinner className="text-zinc-400" /></div>;
  }

  if (!order) {
    return <p className="text-center text-zinc-500 py-10">Order not found.</p>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (order as any).user;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addr = (order as any).delivery_address;
  const { label: orderLabel } = orderStatusMeta(order.order_status);
  const { label: payLabel } = paymentStatusMeta(order.payment_status);

  const timelineSteps = ['pending', 'processing', 'shipped', 'delivered'];
  const currentIdx = timelineSteps.indexOf(order.order_status);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/orders')}
          className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Back to orders"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h2>
          <p className="text-xs text-zinc-400">{formatDate(order.created_at)}</p>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex gap-2">
        <Badge variant={statusToBadge[order.order_status] ?? 'default'}>{orderLabel}</Badge>
        <Badge variant={statusToBadge[order.payment_status] ?? 'default'}>{payLabel}</Badge>
      </div>

      {/* Order Timeline */}
      {order.order_status !== 'cancelled' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Order Timeline</h3>
          <div className="flex items-start justify-between relative">
            <div className="absolute top-1.5 left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-700 mx-4" />
            <div
              className="absolute top-1.5 left-0 h-0.5 bg-zinc-900 dark:bg-white mx-4 transition-all duration-500"
              style={{ width: currentIdx >= 0 ? `${(currentIdx / (timelineSteps.length - 1)) * (100 - 8)}%` : '0%' }}
            />
            {timelineSteps.map((step, i) => (
              <TimelineStep
                key={step}
                label={step.charAt(0).toUpperCase() + step.slice(1)}
                active={i === currentIdx}
                done={i < currentIdx}
              />
            ))}
          </div>
        </div>
      )}

      {/* Update status */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Update Status</h3>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={order.order_status === s ? 'primary' : 'outline'}
              loading={updating && order.order_status !== s}
              onClick={() => handleStatus(s)}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Customer info */}
      {user && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Customer</h3>
          <p className="text-sm font-medium text-zinc-900 dark:text-white">
            {user.first_name} {user.last_name ?? ''}
          </p>
          {user.username && (
            <p className="text-sm text-zinc-500">@{user.username}</p>
          )}
          <p className="text-xs text-zinc-400">Telegram ID: {user.telegram_id}</p>
        </div>
      )}

      {/* Delivery address */}
      {addr && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Delivery Address</h3>
          </div>
          <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <p className="font-medium text-zinc-900 dark:text-white">{addr.full_name}</p>
            <p>{addr.phone}</p>
            <p>{addr.city}, {addr.subcity}{addr.woreda ? `, Woreda ${addr.woreda}` : ''}{addr.house_number ? `, House ${addr.house_number}` : ''}</p>
            {addr.notes && <p className="text-zinc-400 italic">"{addr.notes}"</p>}
          </div>
        </div>
      )}

      {/* Order items */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
          Items ({(order.items ?? []).length})
        </h3>
        <div className="space-y-3">
          {(order.items ?? []).map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(item.product as any)?.image_url ? (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <img src={(item.product as any).image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{(item.product as any)?.name ?? 'Product'}</p>
                <p className="text-xs text-zinc-400">Size: {item.size} · Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white flex-shrink-0">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 mt-3 pt-3 flex justify-between">
          <span className="font-bold text-zinc-900 dark:text-white">Total</span>
          <span className="font-bold text-zinc-900 dark:text-white">{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  );
};
