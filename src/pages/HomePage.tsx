import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from '@/components/ui/icons';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { ProductGrid } from '@/components/product/ProductGrid';
import { useUserStore } from '@/store/useUserStore';
import { cn } from '@/utils/cn';

export const HomePage = () => {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const categories = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const { products, loading, error } = useProducts({
    category: selectedCategory,
    pageSize: 40,
  });

  const { products: featured } = useProducts({ featured: true, pageSize: 6 });

  return (
    <div className="px-4 pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {user ? `Hey, ${user.first_name} 👋` : 'Welcome to'}
          </p>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Union Shop
          </h1>
        </div>
      </div>

      {/* Search bar */}
      <button
        onClick={() => navigate('/search')}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-sm shadow-sm"
      >
        <Search size={16} />
        Search clothes…
      </button>

      {/* Featured */}
      {featured.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white mb-3">
            Featured
          </h2>
          <ProductGrid products={featured} loading={false} />
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={cn(
              'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
              !selectedCategory
                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900'
                : 'border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400',
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize',
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900'
                  : 'border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Products */}
      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-white mb-3">
          {selectedCategory ? selectedCategory : 'All Products'}
        </h2>
        <ProductGrid products={products} loading={loading} error={error} />
      </section>
    </div>
  );
};
