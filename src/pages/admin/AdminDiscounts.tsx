import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';
import { Plus, Trash2, X } from '@/components/ui/icons';
import { formatDate } from '@/utils/format';

interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order: number;
  max_uses: number | null;
  uses: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

const fieldCls = 'block w-full bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors';
const labelCls = 'block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5';

export const AdminDiscounts = () => {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: '', type: 'percentage', value: '', min_order: '0',
    max_uses: '', expires_at: '',
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });
    setCodes((data as DiscountCode[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.value) { setError('Code and value are required'); return; }
    setSaving(true); setError(null);
    try {
      const { error: dbErr } = await supabase.from('discount_codes').insert({
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: parseFloat(form.value),
        min_order: parseFloat(form.min_order) || 0,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
        active: true,
      });
      if (dbErr) throw new Error(dbErr.message);
      setForm({ code: '', type: 'percentage', value: '', min_order: '0', max_uses: '', expires_at: '' });
      setShowForm(false);
      load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to create code'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('discount_codes').update({ active: !active }).eq('id', id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this discount code?')) return;
    await supabase.from('discount_codes').delete().eq('id', id);
    load();
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Discount Codes</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{codes.length} codes created</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-white text-zinc-900 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-zinc-100 transition-colors">
          <Plus size={16} /> New Code
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">New Discount Code</h2>
            <button onClick={() => setShowForm(false)} aria-label="Close" className="text-zinc-500 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Code</label>
                <input value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. EID20" className={fieldCls} required />
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                  aria-label="Discount type"
                  title="Discount type"
                  className={fieldCls}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (ETB)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{form.type === 'percentage' ? 'Discount %' : 'Discount ETB'}</label>
                <input type="number" value={form.value} onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder={form.type === 'percentage' ? 'e.g. 20' : 'e.g. 100'}
                  className={fieldCls} required />
              </div>
              <div>
                <label className={labelCls}>Min Order (ETB)</label>
                <input type="number" value={form.min_order} onChange={(e) => setForm(f => ({ ...f, min_order: e.target.value }))}
                  placeholder="0" className={fieldCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Max Uses (optional)</label>
                <input type="number" value={form.max_uses} onChange={(e) => setForm(f => ({ ...f, max_uses: e.target.value }))}
                  placeholder="Unlimited" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Expires (optional)</label>
                <input type="date" value={form.expires_at} onChange={(e) => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  aria-label="Expiry date" title="Expiry date"
                  className={fieldCls} />
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex-1 bg-white text-zinc-900 font-semibold py-2.5 rounded-xl text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />}
                Create Code
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 bg-zinc-800 text-zinc-300 font-semibold py-2.5 rounded-xl text-sm hover:bg-zinc-700 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Codes table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner className="text-zinc-600" /></div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12 text-zinc-600">No discount codes yet. Create one above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-5 py-3 text-xs text-zinc-500 font-medium">Code</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Discount</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Min Order</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Uses</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Expires</th>
                  <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Status</th>
                  <th className="text-right px-3 py-3 text-xs text-zinc-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-white">{c.code}</td>
                    <td className="px-3 py-3 text-zinc-300">
                      {c.type === 'percentage' ? `${c.value}%` : `ETB ${c.value}`} off
                    </td>
                    <td className="px-3 py-3 text-zinc-500 text-xs">
                      {c.min_order > 0 ? `ETB ${c.min_order}` : '—'}
                    </td>
                    <td className="px-3 py-3 text-zinc-400 text-xs">
                      {c.uses}{c.max_uses ? ` / ${c.max_uses}` : ' / ∞'}
                    </td>
                    <td className="px-3 py-3 text-zinc-500 text-xs">
                      {c.expires_at ? formatDate(c.expires_at) : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => toggleActive(c.id, c.active)}
                        className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                          c.active ? 'bg-green-900/40 text-green-400 hover:bg-red-900/40 hover:text-red-400' : 'bg-zinc-800 text-zinc-500 hover:bg-green-900/40 hover:text-green-400'
                        }`}>
                        {c.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => handleDelete(c.id)} aria-label={`Delete ${c.code}`}
                        className="p-2 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
