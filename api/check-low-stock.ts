/* eslint-disable */
// @ts-nocheck
/**
 * POST /api/check-low-stock
 * Checks for products with stock <= threshold and notifies admin via Telegram.
 * Called after an order is placed.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const BOT_TOKEN     = process.env.TELEGRAM_BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!SUPABASE_URL || !SUPABASE_KEY || !BOT_TOKEN || !ADMIN_CHAT_ID) {
      return res.status(200).json({ skipped: true });
    }

    const threshold = 5;

    // Fetch low stock products
    const stockRes = await fetch(
      `${SUPABASE_URL}/rest/v1/products?stock=lte.${threshold}&select=id,name,stock,category&order=stock.asc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const lowStockProducts = await stockRes.json();

    if (!Array.isArray(lowStockProducts) || lowStockProducts.length === 0) {
      return res.status(200).json({ alerts: 0 });
    }

    const lines = lowStockProducts.map((p) =>
      p.stock === 0
        ? `  ❌ *${p.name}* — OUT OF STOCK`
        : `  ⚠️ *${p.name}* — only ${p.stock} left`
    ).join('\n');

    const message = [
      '⚠️ *Low Stock Alert — Union Shop*',
      '',
      `${lowStockProducts.length} product${lowStockProducts.length > 1 ? 's' : ''} need restocking:`,
      '',
      lines,
      '',
      'Go to admin → Products to update stock.',
    ].join('\n');

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: message, parse_mode: 'Markdown' }),
    });

    return res.status(200).json({ alerts: lowStockProducts.length });
  } catch (err) {
    console.error('check-low-stock error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
