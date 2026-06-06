import type { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShoppingBag } from '@/components/ui/icons';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  error?: string | null;
}

export const ProductGrid = ({ products, loading, error }: ProductGridProps) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" className="text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Failed to load products"
        description={error}
      />
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag />}
        title="No products found"
        description="Try adjusting your search or filters."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
