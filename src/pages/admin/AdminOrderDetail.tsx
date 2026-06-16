import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from '@/components/ui/icons';
import { supabase } from '@/lib/supabase';
import { updateOrderStatus } from '@/services/orders';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice, formatDate } from '@/utils/format';
import type { Order } from '@/types';

const ORDER_STATUSES: Order['order_status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  processing: 'bg-blue-900/40 text-blue-400 border-blue-800',
  shipped:    'bg-indigo-900/40 text-indigo-400 border-indigo-800',
  delivered:  'bg-green-900/40 text-green-400 border-green-800',
  cancelled:  'bg-red-900/40 text-red-400 border-red-800',
  paid:       'bg-green-900/40 text-green-400 border-green-800',
  failed:     'bg-red-900/40 text-red-400 border-red-800',
};

const TimelineStep = ({ label, active, done }: { label: string; active: boolean; done: boolean }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className={`w-4 h-4 rounded-full border-2 transition-all ${
      done    ? 'bg-green-500 border-green-500' :
      active  ? 'bg-white border-white' :
                'bg-zinc-800 border-zinc-700'
    }`} />
    <span className={`text-[10px] text-center ${done || active ? 'text-zinc-300 font-medium' : 'text-zinc-600'}`}>
      {label}
    </span>
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
      .select('*, user:users(id,first_name,last_name,username,telegram_id), items:order_items(id,size,quantity,price,product:products(id,name,image_url))')
      .eq('id', id).single();
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
    return <div className="flex items-center justify-center h-64"><Spinner className="text-zinc-600" /></div>;
  }
  if (!order) {
    return <div className="p-6 text-zinc-500">Order not found.</div>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (order as any).user;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addr = (order as any).delivery_address;
  const timelineSteps = ['pending', 'processing', 'shipped', 'delivered'];
  const currentIdx = timelineSteps.indexOf(order.order_status);

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/orders')} aria-label="Back to orders"
          className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-sm text-zinc-500">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.payment_status] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
            {order.payment_status}
          </span>
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.order_status] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
            {order.order_status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Timeline */}
          {order.order_status !== 'cancelled' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-5">Order Progress</p>
              <div className="relative flex justify-between items-start">
                <div className="absolute top-2 left-0 right-0 h-0.5 bg-zinc-800 mx-5" />
                <div className="absolute top-2 left-0 h-0.5 bg-green-500 mx-5 transition-all duration-500"
                  style={{ width: currentIdx >= 0 ? `${(currentIdx / 3) * (100 - 10)}%` : '0%' }} />
                {timelineSteps.map((step, i) => (
                  <TimelineStep key={step} label={step.charAt(0).toUpperCase() + step.slice(1)}
                    active={i === currentIdx} done={i < currentIdx} />
                ))}
              </div>
            </div>
          )}

          {/* Update status */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Update Status</p>
              {updating && <Spinner size="sm" className="text-zinc-500" />}
            </div>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map((s) => (
                <button key={s} onClick={() => handleStatus(s)} disabled={updating}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all capitalize ${
                    order.order_status === s
                      ? 'bg-white text-zinc-900 border-white'
                      : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                  }`}>{s}</button>
              ))}
            </div>
          </div>

          {/* Order items */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <p className="text-sm font-semibold text-white">
                Items ({(order.items ?? []).length})
              </p>
            </div>
            <div className="divide-y divide-zinc-800">
              {(order.items ?? []).map((item) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const product = item.product as any;
                return (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                    {product?.image_url
                      ? <img src={product.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      : <div className="w-12 h-12 rounded-lg bg-zinc-800 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-200 font-medium truncate">{product?.name ?? 'Product'}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">Size: {item.size} · Qty: {item.quantity}</p>
                    </div>
                    <p className="text-white font-semibold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-4 border-t border-zinc-800 flex justify-between">
              <span className="text-zinc-400 text-sm">Total</span>
              <span className="text-white font-bold text-lg">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Customer */}
          {user && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Customer</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400 flex-shrink-0">
                  {user.first_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-zinc-200 font-medium">{user.first_name} {user.last_name ?? ''}</p>
                  {user.username && <p className="text-zinc-500 text-xs">@{user.username}</p>}
                </div>
              </div>
              <div className="text-xs text-zinc-600 bg-zinc-800 rounded-lg px-3 py-2">
                Telegram ID: {user.telegram_id}
              </div>
            </div>
          )}

          {/* Delivery address */}
          {addr ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-zinc-500" />
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Delivery Address</p>
              </div>
              <div className="space-y-1.5 text-sm">
                <p className="text-zinc-200 font-medium">{addr.full_name}</p>
                <p className="text-zinc-400">{addr.phone}</p>
                <p className="text-zinc-400">
                  {addr.city}, {addr.subcity}
                  {addr.woreda ? `, Woreda ${addr.woreda}` : ''}
                  {addr.house_number ? `, House ${addr.house_number}` : ''}
                </p>
                {addr.notes && (
                  <p className="text-zinc-600 italic text-xs mt-2">"{addr.notes}"</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-xs text-zinc-600">No delivery address provided</p>
            </div>
          )}

          {/* Order summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Order ID</span>
                <span className="text-zinc-300 font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Items</span>
                <span className="text-zinc-300">{(order.items ?? []).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total</span>
                <span className="text-white font-semibold">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
