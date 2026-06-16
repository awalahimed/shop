/* eslint-disable */
// @ts-nocheck
/**
 * POST /api/notify-customer
 * Sends a Telegram message to the customer when their order status changes.
 * Body: { orderId, newStatus }
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { orderId, newStatus } = req.body;
    if (!orderId || !newStatus) return res.status(400).json({ error: 'orderId and newStatus required' });

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN;

    if (!SUPABASE_URL || !SUPABASE_KEY || !BOT_TOKEN) {
      return res.status(500).json({ error: 'Missing server configuration' });
    }

    // Fetch order + customer telegram_id
    const orderRes = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=id,total,order_status,user:users(telegram_id,first_name)`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const orders = await orderRes.json();
    const order = orders?.[0];
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const telegramId = order.user?.telegram_id;
    if (!telegramId) return res.status(400).json({ error: 'Customer has no Telegram ID' });

    const statusMessages = {
      processing: `✅ Your order #${order.id.slice(0,8).toUpperCase()} has been confirmed and is being processed.`,
      shipped:    `🚚 Great news! Your order #${order.id.slice(0,8).toUpperCase()} has been shipped and is on its way to you.`,
      delivered:  `🎉 Your order #${order.id.slice(0,8).toUpperCase()} has been delivered! Thank you for shopping at Union Shop.`,
      cancelled:  `❌ Your order #${order.id.slice(0,8).toUpperCase()} has been cancelled. Contact us if you have questions.`,
    };

    const text = statusMessages[newStatus];
    if (!text) return res.status(200).json({ sent: false, reason: 'No message for this status' });

    const message = [
      `Hello ${order.user.first_name} 👋`,
      '',
      text,
      '',
      `🛍 *Union Shop*`,
      `Open our shop: t.me/ahimed_shop_bot/shop`,
    ].join('\n');

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: telegramId, text: message, parse_mode: 'Markdown' }),
    });

    const tgData = await tgRes.json();
    console.log('Customer notification:', tgData.ok ? 'sent' : 'failed', tgData.description ?? '');

    return res.status(200).json({ sent: tgData.ok, description: tgData.description });
  } catch (err) {
    console.error('notify-customer error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
