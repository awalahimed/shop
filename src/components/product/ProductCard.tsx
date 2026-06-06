import { Link } from 'react-router-dom';
import { ShoppingBag } from '@/components/ui/icons';
import type { Product, Size } from '@/types';
import { formatPrice } from '@/utils/format';
import { useCartStore } from '@/store/useCartStore';
import { haptic } from '@/lib/telegram';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCartStore((s) => s.addItem);

  const availableSizes = (product.sizes ?? []).map((s) => s.size);
  const defaultSize: Size = availableSizes[0] ?? 'M';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // don't navigate
    addItem(product, defaultSize);
    haptic.success();
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fadeIn"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-600">
            <ShoppingBag size={40} />
          </div>
        )}
        {product.featured && (
          <span className="absolute top-2 left-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium px-2 py-0.5 rounded-full">
            Featured
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        <div>
          <p className="text-xs text-zinc-400 uppercase tracking-wide">{product.category}</p>
          <h3 className="font-semibold text-zinc-900 dark:text-white text-sm leading-tight line-clamp-2">
            {product.name}
          </h3>
        </div>

        {/* Sizes */}
        {availableSizes.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {availableSizes.map((sz) => (
              <span
                key={sz}
                className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-md px-1.5 py-0.5 text-zinc-500 dark:text-zinc-400"
              >
                {sz}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-zinc-900 dark:text-white">
            {formatPrice(product.price)}
          </span>

          <button
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className="p-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-80 transition-opacity active:scale-95"
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      </div>
    </Link>
  );
};
