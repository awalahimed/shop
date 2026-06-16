import { useState } from 'react';
import { Plus, Pencil, Trash2, ImageIcon, ArrowLeft, Search, X } from '@/components/ui/icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProducts } from '@/hooks/useProducts';
import { createProduct, updateProduct, deleteProduct } from '@/services/products';
import { uploadProductImage } from '@/services/storage';
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

const fieldCls = 'block w-full bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors';
const labelCls = 'block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5';

const ProductForm = ({ initial, onSave, onCancel }: { initial?: Product; onSave: () => void; onCancel: () => void }) => {
  const [selectedSizes, setSelectedSizes] = useState<Size[]>(initial?.sizes?.map((s) => s.size) ?? []);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: initial
      ? { name: initial.name, description: initial.description, category: initial.category, price: initial.price, stock: initial.stock, featured: initial.featured }
      : { stock: 0, featured: false },
  });

  const toggleSize = (size: Size) =>
    setSelectedSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]);

  const onSubmit = async (data: FormData) => {
    setSaving(true); setError(null);
    try {
      let imageUrl = initial?.image_url ?? '';
      if (imageFile) imageUrl = await uploadProductImage(imageFile);
      const payload = { ...data, image_url: imageUrl, images: [], featured: data.featured ?? false };
      if (initial) await updateProduct(initial.id, payload, selectedSizes);
      else await createProduct(payload, selectedSizes);
      onSave();
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} aria-label="Back" className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{initial ? 'Edit Product' : 'New Product'}</h1>
          <p className="text-sm text-zinc-500">{initial ? 'Update product details' : 'Add a new product to your catalog'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className={labelCls}>Product Name</label>
          <input {...register('name')} placeholder="e.g. Classic White Tee" className={fieldCls} />
          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea {...register('description')} rows={3} placeholder="Describe the product…" className={`${fieldCls} resize-none`} />
          {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Category</label>
            <input {...register('category')} placeholder="e.g. T-Shirts" className={fieldCls} />
            {errors.category && <p className="text-xs text-red-400 mt-1">{errors.category.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Price (ETB)</label>
            <input {...register('price')} type="number" placeholder="e.g. 450" className={fieldCls} />
            {errors.price && <p className="text-xs text-red-400 mt-1">{errors.price.message}</p>}
          </div>
        </div>

        <div>
          <label className={labelCls}>Stock Quantity</label>
          <input {...register('stock')} type="number" placeholder="0" className={fieldCls} />
          {errors.stock && <p className="text-xs text-red-400 mt-1">{errors.stock.message}</p>}
        </div>

        <div>
          <label className={labelCls}>Available Sizes</label>
          <div className="flex gap-2">
            {SIZES.map((sz) => (
              <button key={sz} type="button" onClick={() => toggleSize(sz)}
                className={`w-12 h-12 rounded-xl text-sm font-semibold border transition-all ${
                  selectedSizes.includes(sz) ? 'bg-white text-zinc-900 border-white' : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}>{sz}</button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Product Image</label>
          <label className="flex items-center gap-3 px-4 py-3 bg-zinc-800 border border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-zinc-500 transition-colors">
            <ImageIcon size={16} className="text-zinc-500" aria-hidden="true" />
            <span className="text-sm text-zinc-500">{imageFile ? imageFile.name : 'Click to upload image'}</span>
            <input type="file" accept="image/*" className="sr-only" aria-label="Upload product image"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
          </label>
          {initial?.image_url && !imageFile && (
            <img src={initial.image_url} alt="" className="w-16 h-16 rounded-lg object-cover mt-2" />
          )}
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" {...register('featured')} className="w-4 h-4 rounded accent-white" />
          <div>
            <p className="text-sm text-zinc-300 font-medium">Featured Product</p>
            <p className="text-xs text-zinc-600">Show on home page featured section</p>
          </div>
        </label>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-2.5">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="flex-1 bg-white text-zinc-900 font-semibold py-3 rounded-xl text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />}
            {initial ? 'Save Changes' : 'Create Product'}
          </button>
          <button type="button" onClick={onCancel}
            className="flex-1 bg-zinc-800 text-zinc-300 font-semibold py-3 rounded-xl text-sm hover:bg-zinc-700 transition-colors"
          >Cancel</button>
        </div>
      </form>
    </div>
  );
};

export const AdminProducts = () => {
  const { products, loading, refetch } = useProducts({ pageSize: 100 });
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{products.length} items in catalog</p>
        </div>
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-2 bg-white text-zinc-900 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-zinc-100 transition-colors"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
          className="w-full pl-9 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
            <X size={12} />
          </button>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner className="text-zinc-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-5 py-3 text-xs text-zinc-500 font-medium">Product</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Category</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Price</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Stock</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Featured</th>
                  <th className="text-right px-3 py-3 text-xs text-zinc-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url
                          ? <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          : <div className="w-10 h-10 rounded-lg bg-zinc-800 flex-shrink-0" />}
                        <p className="font-medium text-zinc-200 truncate max-w-[180px]">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-zinc-500 text-xs capitalize">{p.category}</td>
                    <td className="px-3 py-3 text-white font-semibold">{formatPrice(p.price)}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-medium ${p.stock <= 5 ? 'text-red-400' : p.stock <= 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {p.featured
                        ? <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-900/40 text-yellow-400">Featured</span>
                        : <span className="text-zinc-700 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}
                          className="p-2 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} aria-label={`Delete ${p.name}`} disabled={deleting === p.id}
                          className="p-2 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors">
                          {deleting === p.id ? <Spinner size="sm" className="text-zinc-500" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-12 text-zinc-600">No products found</div>}
          </div>
        )}
      </div>
    </div>
  );
};
