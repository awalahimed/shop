import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from '@/components/ui/icons';
import { useCartStore } from '@/store/useCartStore';
import { useUserStore } from '@/store/useUserStore';
import { CartItemRow } from '@/components/cart/CartItem';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/utils/format';
import { createOrder } from '@/services/orders';
import { initializePayment } from '@/services/payment';
import { haptic, tg } from '@/lib/telegram';

export const CartPage = () => {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, clearCart } = useCartStore();
  const user = useUserStore((s) => s.user);
  const loading = useUserStore((s) => s.loading);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = totalItems();
  const total = totalPrice();

  const handleCheckout = async () => {
    // Still loading user
    if (loading) return;

    // No user — can happen when opened in browser outside Telegram
    if (!user) {
      setError('Could not identify your account. Please open this app inside Telegram.');
      return;
    }

    if (items.length === 0) return;

    setCheckingOut(true);
    setError(null);
    haptic.medium();

    try {
      // 1. Create pending order in DB
      const order = await createOrder(user.id, items, total);

      // 2. Use a valid email format Chapa accepts
      const email = `user${user.telegram_id}@gmail.com`;

      // 3. Initialize Chapa payment via Edge Function
      const { checkout_url } = await initializePayment(
        order.id,
        total,
        email,
        user.first_name,
        user.last_name ?? 'User',
      );

      // 4. Clear cart before opening payment
      clearCart();

      // 5. Open Chapa — inside Telegram use openLink, in browser use window.open
      const webapp = tg();
      if (webapp) {
        webapp.openLink(checkout_url);
      } else {
        window.open(checkout_url, '_blank');
      }

      // 6. Navigate to orders so user can track
      navigate('/orders');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Checkout failed';
      setError(msg);
      haptic.error();
      console.error('Checkout error:', e);
    } finally {
      setCheckingOut(false);
    }
  };

  if (count === 0) {
    return (
      <div className="px-4 pt-6 min-h-screen flex flex-col">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Cart</h1>
        <EmptyState
          icon={<ShoppingBag />}
          title="Your cart is empty"
          description="Add some items to get started."
          action={
            <Button variant="primary" onClick={() => navigate('/')}>
              Browse Products
            </Button>
          }
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Cart</h1>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {count} item{count !== 1 && 's'}
        </span>
      </div>

      {/* Items list */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl px-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
        {items.map((item) => (
          <CartItemRow key={`${item.product.id}-${item.size}`} item={item} />
        ))}
      </div>

      {/* Order summary */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-2">
        <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
          <span>Subtotal</span>
          <span>{formatPrice(total)}</span>
        </div>
        <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
          <span>Shipping</span>
          <span className="text-green-600 font-medium">Free</span>
        </div>
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex justify-between font-bold text-zinc-900 dark:text-white">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
        </div>
      )}

      {/* Checkout button */}
      <Button
        fullWidth
        size="lg"
        loading={checkingOut || loading}
        onClick={handleCheckout}
      >
        {checkingOut ? 'Processing…' : `Checkout · ${formatPrice(total)}`}
      </Button>

      <p className="text-xs text-zinc-400 text-center">
        Powered by Chapa · Secure payment
      </p>
    </div>
  );
};
