import { Minus, Plus, Trash2 } from '@/components/ui/icons';
import type { LocalCartItem, Size } from '@/types';
import { formatPrice } from '@/utils/format';
import { useCartStore } from '@/store/useCartStore';
import { haptic } from '@/lib/telegram';

interface CartItemProps {
  item: LocalCartItem;
}

const SIZES: Size[] = ['S', 'M', 'L', 'XL'];

export const CartItemRow = ({ item }: CartItemProps) => {
  const { updateQuantity, updateSize, removeItem } = useCartStore();

  const handleRemove = () => {
    haptic.light();
    removeItem(item.product.id, item.size);
  };

  const handleQty = (delta: number) => {
    haptic.selection();
    updateQuantity(item.product.id, item.size, item.quantity + delta);
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    haptic.selection();
    updateSize(item.product.id, item.size, e.target.value as Size);
  };

  return (
    <div className="flex gap-3 py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 animate-fadeIn">
      {/* Image */}
      <div className="w-20 h-24 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
        {item.product.image_url && (
          <img
            src={item.product.image_url}
            alt={item.product.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex justify-between items-start gap-2">
          <p className="font-medium text-sm text-zinc-900 dark:text-white leading-tight line-clamp-2">
            {item.product.name}
          </p>
          <button
            onClick={handleRemove}
            aria-label="Remove item"
            className="text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0 p-0.5"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* Size select */}
        <select
          value={item.size}
          onChange={handleSizeChange}
          aria-label="Select size"
          className="w-16 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-700 dark:text-zinc-300 px-1.5 py-1 focus:outline-none"
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="flex items-center justify-between mt-auto">
          {/* Quantity */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQty(-1)}
              aria-label="Decrease quantity"
              className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Minus size={12} />
            </button>
            <span className="text-sm font-medium w-4 text-center text-zinc-900 dark:text-white">
              {item.quantity}
            </span>
            <button
              onClick={() => handleQty(1)}
              aria-label="Increase quantity"
              className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>

          <span className="font-bold text-sm text-zinc-900 dark:text-white">
            {formatPrice(item.product.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
};
