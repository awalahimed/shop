import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Minus, Plus } from '@/components/ui/icons';
import { useProduct } from '@/hooks/useProducts';
import { SizeSelector } from '@/components/product/SizeSelector';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice } from '@/utils/format';
import { useCartStore } from '@/store/useCartStore';
import { haptic } from '@/lib/telegram';
import { useTelegramBackButton } from '@/hooks/useTelegram';
import type { Size } from '@/types';

export const ProductDetailPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { product, loading, error } = useProduct(id);
  const addItem = useCartStore((s) => s.addItem);

  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageIdx, setImageIdx] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useTelegramBackButton();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" className="text-zinc-400" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-4 text-center">
        <p className="text-zinc-500">Product not found.</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </div>
    );
  }

  const availableSizes: Size[] = (product.sizes ?? []).map((s) => s.size);
  const images = [product.image_url, ...(product.images ?? [])].filter(Boolean);

  const handleAddToCart = () => {
    if (!selectedSize) {
      haptic.error();
      return;
    }
    addItem(product, selectedSize, quantity);
    haptic.success();
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  return (
    <div className="pb-24 animate-fadeIn">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-10 p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-sm"
        aria-label="Go back"
      >
        <ArrowLeft size={20} className="text-zinc-800 dark:text-white" />
      </button>

      {/* Images */}
      <div className="relative aspect-[4/5] bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
        {images.length > 0 ? (
          <img
            src={images[imageIdx]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart size={60} className="text-zinc-300" />
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 px-4 pt-3 overflow-x-auto scrollbar-none">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setImageIdx(i)}
              aria-label={`View image ${i + 1}`}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                imageIdx === i ? 'border-zinc-900 dark:border-white' : 'border-transparent'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-4 space-y-4">
        <div className="flex justify-between items-start gap-2">
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wide">{product.category}</p>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{product.name}</h1>
          </div>
          <span className="text-xl font-bold text-zinc-900 dark:text-white flex-shrink-0">
            {formatPrice(product.price)}
          </span>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {product.description}
        </p>

        {/* Stock */}
        <p className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </p>

        {/* Size selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Size</p>
            {!selectedSize && (
              <p className="text-xs text-red-500">Please select a size</p>
            )}
          </div>
          <SizeSelector
            available={availableSizes}
            selected={selectedSize}
            onChange={setSelectedSize}
          />
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-900 dark:text-white">Quantity</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Minus size={16} />
            </button>
            <span className="text-lg font-semibold text-zinc-900 dark:text-white w-6 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              aria-label="Increase quantity"
              className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Add to cart */}
        <Button
          fullWidth
          size="lg"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="mt-2"
        >
          <ShoppingCart size={18} />
          {addedFeedback ? 'Added to Cart ✓' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
};
