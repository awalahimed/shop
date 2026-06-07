import { useState } from 'react';
import { Plus, Pencil, Trash2, ImageIcon } from '@/components/ui/icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProducts } from '@/hooks/useProducts';
import { createProduct, updateProduct, deleteProduct } from '@/services/products';
import { uploadProductImage } from '@/services/storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice } from '@/utils/format';
import type { Product, Size } from '@/types';

const SIZES: Size[] = ['S', 'M', 'L', 'XL'];

const schema = z.object({
  name:        z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  category:    z.string().min(1, 'Category is required'),
  price:       z.coerce.number().min(1, 'Price must be greater than 0'),
  stock:       z.coerce.number().min(0, 'Stock cannot be negative'),
  featured:    z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

const ProductForm = ({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Product;
  onSave: () => void;
  onCancel: () => void;
}) => {
  const [selectedSizes, setSelectedSizes] = useState<Size[]>(
    initial?.sizes?.map((s) => s.size) ?? [],
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: initial
      ? {
          name: initial.name,
          description: initial.description,
          category: initial.category,
          price: initial.price,
          stock: initial.stock,
          featured: initial.featured,
        }
      : { stock: 0, featured: false },
  });

  const toggleSize = (size: Size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setError(null);
    try {
      let imageUrl = initial?.image_url ?? '';

      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      const payload = { ...data, image_url: imageUrl, images: [], featured: data.featured ?? false };

      if (initial) {
        await updateProduct(initial.id, payload, selectedSizes);
      } else {
        await createProduct(payload, selectedSizes);
      }

      onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
      <h3 className="font-semibold text-zinc-900 dark:text-white">
        {initial ? 'Edit Product' : 'New Product'}
      </h3>

      <Input label="Name" {...register('name')} error={errors.name?.message} />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 resize-none"
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Category" {...register('category')} error={errors.category?.message} />
        <Input label="Price (ETB)" type="number" {...register('price')} error={errors.price?.message} />
      </div>
      <Input label="Stock" type="number" {...register('stock')} error={errors.stock?.message} />

      {/* Sizes */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sizes</p>
        <div className="flex gap-2">
          {SIZES.map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => toggleSize(sz)}
              className={`w-10 h-10 rounded-xl text-sm font-medium border transition-all ${
                selectedSizes.includes(sz)
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900'
                  : 'border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Image upload */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Image</p>
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
          <ImageIcon size={16} className="text-zinc-400" aria-hidden="true" />
          <span className="text-sm text-zinc-500">
            {imageFile ? imageFile.name : 'Click to upload image'}
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Upload product image"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {initial?.image_url && !imageFile && (
          <img src={initial.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
        )}
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="featured" {...register('featured')} className="rounded" />
        <label htmlFor="featured" className="text-sm text-zinc-700 dark:text-zinc-300">Featured</label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" loading={saving} className="flex-1">Save</Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
      </div>
    </form>
  );
};

export const AdminProducts = () => {
  const { products, loading, refetch } = useProducts({ pageSize: 100 });
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    setDeleting(id);
    await deleteProduct(id).catch(console.error);
    setDeleting(null);
    refetch();
  };

  if (editing) {
    return (
      <ProductForm
        initial={editing === 'new' ? undefined : editing}
        onSave={() => { setEditing(null); refetch(); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Products</h2>
        <Button size="sm" onClick={() => setEditing('new')}>
          <Plus size={16} /> Add
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner className="text-zinc-400" /></div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-100 dark:border-zinc-800 shadow-sm"
            >
              {p.image_url ? (
                <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-zinc-900 dark:text-white truncate">{p.name}</p>
                <p className="text-xs text-zinc-400">{p.category} · {formatPrice(p.price)}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditing(p)}
                  aria-label={`Edit ${p.name}`}
                  className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                  disabled={deleting === p.id}
                >
                  {deleting === p.id ? <Spinner size="sm" /> : <Trash2 size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
