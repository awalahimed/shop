import { useState, useCallback } from 'react';
import { ArrowLeft, Search, X } from '@/components/ui/icons';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { ProductGrid } from '@/components/product/ProductGrid';
import { useTelegramBackButton } from '@/hooks/useTelegram';

export const SearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useTelegramBackButton();

  // Simple debounce via timeout ref
  const handleChange = useCallback((value: string) => {
    setQuery(value);
    clearTimeout((window as Window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer);
    (window as Window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(
      () => setDebouncedQuery(value),
      400,
    );
  }, []);

  const { products, loading, error } = useProducts({
    search: debouncedQuery || undefined,
    pageSize: 40,
  });

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-zinc-900 dark:text-white">Search</h1>
      </div>

      {/* Input */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          autoFocus
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search products…"
          className="w-full pl-9 pr-10 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setDebouncedQuery(''); }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Results */}
      {debouncedQuery ? (
        <ProductGrid products={products} loading={loading} error={error} />
      ) : (
        <p className="text-center text-sm text-zinc-400 py-12">
          Type to search…
        </p>
      )}
    </div>
  );
};
