import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';

export interface ProductFilters {
  category?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  pageSize?: number;
}

/** Fetch paginated/filtered products */
export const getProducts = async (
  filters: ProductFilters = {},
): Promise<{ data: Product[]; count: number }> => {
  const { category, search, featured, page = 1, pageSize = 20 } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('products')
    .select('*, sizes:product_sizes(id, product_id, size)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (category) query = query.eq('category', category);
  if (featured !== undefined) query = query.eq('featured', featured);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data: (data as Product[]) ?? [], count: count ?? 0 };
};

/** Fetch a single product with sizes */
export const getProduct = async (id: string): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .select('*, sizes:product_sizes(id, product_id, size)')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Product;
};

/** Admin: create product */
export const createProduct = async (
  product: Omit<Product, 'id' | 'created_at' | 'sizes'>,
  sizes: string[],
): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Insert sizes
  if (sizes.length) {
    const sizeRows = sizes.map((size) => ({ product_id: data.id, size }));
    const { error: sizeError } = await supabase
      .from('product_sizes')
      .insert(sizeRows);
    if (sizeError) throw new Error(sizeError.message);
  }

  return data as Product;
};

/** Admin: update product */
export const updateProduct = async (
  id: string,
  updates: Partial<Omit<Product, 'id' | 'created_at' | 'sizes'>>,
  sizes?: string[],
): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (sizes) {
    // Replace all sizes
    await supabase.from('product_sizes').delete().eq('product_id', id);
    if (sizes.length) {
      const sizeRows = sizes.map((size) => ({ product_id: id, size }));
      const { error: sizeError } = await supabase
        .from('product_sizes')
        .insert(sizeRows);
      if (sizeError) throw new Error(sizeError.message);
    }
  }

  return data as Product;
};

/** Admin: delete product */
export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

/** Get distinct categories */
export const getCategories = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .order('category');

  if (error) throw new Error(error.message);
  const unique = [...new Set((data ?? []).map((r: { category: string }) => r.category))];
  return unique;
};
