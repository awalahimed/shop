import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, X } from '@/components/ui/icons';
import { useCartStore } from '@/store/useCartStore';
import { useUserStore } from '@/store/useUserStore';
import { CartItemRow } from '@/components/cart/CartItem';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AddressForm, type AddressData } from '@/components/checkout/AddressForm';
import { formatPrice } from '@/utils/format';
import { createOrder } from '@/services/orders';
import { initializePayment } from '@/services/payment';
import { haptic, tg } from '@/lib/telegram';

type Step = 'cart' | 'address';

interface DiscountResult {
  code: string;
  discountAmount: number;
  finalTotal: number;
  type: string;
  value: number;
}

export const CartPage = () => {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, clearCart } = useCartStore();
  const user    = useUserStore((s) => s.user);
  const loading = useUserStore((s) => s.loading);

  const [step, setStep]             = useState<Step>('cart');
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Discount code state
  const [discountInput, setDiscountInput]   = useState('');
  const [discountResult, setDiscountResult] = useState<DiscountResult | null>(null);
  const [discountError, setDiscountError]   = useState<string | null>(null);
  const [validating, setValidating]         = useState(false);

  const count        = totalItems();
  const subtotal     = totalPrice();
  const discountAmt  = discountResult?.discountAmount ?? 0;
  const total        = subtotal - discountAmt;

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;
    setValidating(true);
    setDiscountError(null);
    setDiscountResult(null);
    haptic.light();
    try {
      const res  = await fetch('/api/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountInput.trim().toUpperCase(), orderTotal: subtotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setDiscountError(data.error ?? 'Invalid discount code');
        haptic.error();
      } else {
        setDiscountResult(data);
        haptic.success();
      }
    } catch {
      setDiscountError('Could not validate code. Try again.');
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountResult(null);
    setDiscountInput('');
    setDiscountError(null);
  };

  const handleAddressSubmit = async (address: AddressData) => {
    if (loading) return;
    if (!user) { setError('Please open this app inside Telegram.'); return; }

    setCheckingOut(true);
    setError(null);
    haptic.medium();

    try {
      const order = await createOrder(user.id, items, total, address, discountResult?.code ?? undefined, discountAmt);

      const email = `user${user.telegram_id}@gmail.com`;
      const { checkout_url } = await initializePayment(order.id, total, email, user.first_name, user.last_name ?? 'User');

      clearCart();
      fetch('/api/check-low-stock', { method: 'POST' }).catch(console.error);

      const webapp = tg();
      if (webapp) webapp.openLink(checkout_url);
      else window.open(checkout_url, '_blank');

      navigate('/orders');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
      haptic.error();
    } finally {
      setCheckingOut(false);
    }
  };

  if (count === 0) {
    return (
      <div className="px-4 pt-6 min-h-screen flex flex-col">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Cart</h1>
        <EmptyState icon={<ShoppingBag />} title="Your cart is empty" description="Add some items to get started."
          action={<Button variant="primary" onClick={() => navigate('/')}>Browse Products</Button>}
          className="flex-1"
        />
      </div>
    );
  }

  if (step === 'address') {
    return (
      <div className="px-4 pt-6 pb-4">
        <AddressForm onSubmit={handleAddressSubmit} onCancel={() => setStep('cart')} loading={checkingOut} />
        {error && (
          <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Cart</h1>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{count} item{count !== 1 && 's'}</span>
      </div>

      {/* Items */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl px-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
        {items.map((item) => (
          <CartItemRow key={`${item.product.id}-${item.size}`} item={item} />
        ))}
      </div>

      {/* Discount code */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-2">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Discount Code</p>
        {discountResult ? (
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">{discountResult.code}</p>
              <p className="text-xs text-green-600 dark:text-green-500">
                {discountResult.type === 'percentage' ? `${discountResult.value}% off` : `ETB ${discountResult.value} off`}
                {' '}— saving {formatPrice(discountAmt)}
              </p>
            </div>
            <button onClick={handleRemoveDiscount} aria-label="Remove discount" className="text-green-600 dark:text-green-400 hover:text-red-500 transition-colors">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
              placeholder="Enter code e.g. EID20"
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 uppercase"
            />
            <Button size="sm" variant="outline" loading={validating} onClick={handleApplyDiscount}>
              Apply
            </Button>
          </div>
        )}
        {discountError && <p className="text-xs text-red-500">{discountError}</p>}
      </div>

      {/* Order summary */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-2">
        <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
          <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
        </div>
        {discountAmt > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount ({discountResult?.code})</span>
            <span>− {formatPrice(discountAmt)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
          <span>Shipping</span><span className="text-green-600 font-medium">Free</span>
        </div>
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex justify-between font-bold text-zinc-900 dark:text-white">
          <span>Total</span><span>{formatPrice(total)}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
        </div>
      )}

      <Button fullWidth size="lg" loading={loading}
        onClick={() => {
          if (!user) { setError('Please open this app inside Telegram.'); return; }
          haptic.light();
          setStep('address');
        }}
      >
        Checkout · {formatPrice(total)}
      </Button>
      <p className="text-xs text-zinc-400 text-center">Powered by Chapa · Secure payment</p>
    </div>
  );
};
