import { supabase } from '@/lib/supabase';

const PRODUCT_BUCKET = 'product-images';

/**
 * Upload a product image and return the public URL.
 */
export const uploadProductImage = async (
  file: File,
  fileName?: string,
): Promise<string> => {
  const ext = file.name.split('.').pop();
  const name = fileName ?? `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `products/${name}`;

  const { error } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Delete a product image by its public URL.
 */
export const deleteProductImage = async (publicUrl: string): Promise<void> => {
  // Extract path from URL: everything after /storage/v1/object/public/<bucket>/
  const marker = `/${PRODUCT_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);

  const { error } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .remove([path]);

  if (error) throw new Error(error.message);
};
