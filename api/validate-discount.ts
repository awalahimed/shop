/* eslint-disable */
// @ts-nocheck
/**
 * POST /api/validate-discount
 * Validates a discount code and returns the discount amount.
 * Body: { code, orderTotal }
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { code, orderTotal } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/discount_codes?code=eq.${encodeURIComponent(code.toUpperCase())}&select=*`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const rows = await r.json();
    const discount = rows?.[0];

    if (!discount) return res.status(404).json({ error: 'Invalid discount code' });
    if (!discount.active) return res.status(400).json({ error: 'This code is no longer active' });
    if (discount.expires_at && new Date(discount.expires_at) < new Date())
      return res.status(400).json({ error: 'This code has expired' });
    if (discount.max_uses && discount.uses >= discount.max_uses)
      return res.status(400).json({ error: 'This code has reached its usage limit' });
    if (orderTotal < discount.min_order)
      return res.status(400).json({ error: `Minimum order ETB ${discount.min_order} required for this code` });

    const discountAmount = discount.type === 'percentage'
      ? Math.round((orderTotal * discount.value) / 100)
      : Math.min(discount.value, orderTotal);

    return res.status(200).json({
      valid: true,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discountAmount,
      finalTotal: orderTotal - discountAmount,
    });

  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
