/* eslint-disable */
// @ts-nocheck
/**
 * GET /api/weekly-report
 * Sends weekly sales report to admin via Telegram.
 * Called by Vercel Cron every Monday at 8am.
 */
export default async function handler(req, res) {
  // Allow manual trigger + Vercel cron (which uses GET)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const BOT_TOKEN     = process.env.TELEGRAM_BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!SUPABASE_URL || !SUPABASE_KEY || !BOT_TOKEN || !ADMIN_CHAT_ID) {
      return res.status(500).json({ error: 'Missing configuration' });
    }

    // Date range: last 7 days
    const now       = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(weekStart.getDate() - 7);

    const weekStartISO     = weekStart.toISOString();
    const prevWeekStartISO = prevWeekStart.toISOString();

    // Fetch this week's paid orders
    const [ordersRes, prevOrdersRes, newUsersRes, itemsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/orders?payment_status=eq.paid&created_at=gte.${weekStartISO}&select=total,created_at`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }),
      fetch(`${SUPABASE_URL}/rest/v1/orders?payment_status=eq.paid&created_at=gte.${prevWeekStartISO}&created_at=lt.${weekStartISO}&select=total`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }),
      fetch(`${SUPABASE_URL}/rest/v1/users?created_at=gte.${weekStartISO}&select=id`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }),
      fetch(`${SUPABASE_URL}/rest/v1/order_items?select=quantity,product:products(name)&order=quantity.desc`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }),
    ]);

    const thisWeekOrders = await ordersRes.json();
    const prevWeekOrders = await prevOrdersRes.json();
    const newUsers       = await newUsersRes.json();
    const allItems       = await itemsRes.json();

    // Calculate stats
    const thisRevenue = (thisWeekOrders ?? []).reduce((s, o) => s + Number(o.total), 0);
    const prevRevenue = (prevWeekOrders ?? []).reduce((s, o) => s + Number(o.total), 0);
    const orderCount  = (thisWeekOrders ?? []).length;
    const newCustomers = (newUsers ?? []).length;
    const avgOrder    = orderCount > 0 ? thisRevenue / orderCount : 0;

    // Revenue change
    let revenueChange = '';
    if (prevRevenue > 0) {
      const pct = ((thisRevenue - prevRevenue) / prevRevenue * 100).toFixed(0);
      revenueChange = Number(pct) >= 0 ? ` ▲ ${pct}% vs last week` : ` ▼ ${Math.abs(Number(pct))}% vs last week`;
    }

    // Best selling product this week
    const productMap = {};
    for (const item of (allItems ?? [])) {
      const name = item.product?.name ?? 'Unknown';
      productMap[name] = (productMap[name] ?? 0) + item.quantity;
    }
    const bestProduct = Object.entries(productMap)
      .sort((a, b) => (b[1] as number) - (a[1] as number))[0];

    // Format dates
    const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    const message = `📊 *Weekly Sales Report*
${fmt(weekStart)} – ${fmt(now)}

💰 *Revenue*
ETB ${thisRevenue.toLocaleString()}${revenueChange}

📦 *Orders*
${orderCount} order${orderCount !== 1 ? 's' : ''} this week
Avg order: ETB ${avgOrder.toLocaleString(undefined, { maximumFractionDigits: 0 })}

👥 *New Customers*
${newCustomers} new customer${newCustomers !== 1 ? 's' : ''} joined

🏆 *Best Selling Product*
${bestProduct ? `${bestProduct[0]} (${bestProduct[1]} units sold)` : 'No sales yet'}

━━━━━━━━━━━━━━━
Have a great week! 🚀
_Union Shop Admin Panel_`;

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const tgData = await tgRes.json();
    console.log('Weekly report sent:', tgData.ok, tgData.description ?? '');

    return res.status(200).json({
      sent: tgData.ok,
      stats: { thisRevenue, orderCount, newCustomers, bestProduct: bestProduct?.[0] ?? 'None' },
    });

  } catch (err) {
    console.error('weekly-report error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
