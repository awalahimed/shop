/* eslint-disable */
// @ts-nocheck
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const txRef = req.method === 'GET'
      ? req.query?.tx_ref
      : req.body?.txRef ?? req.body?.tx_ref;

    if (!txRef) return res.status(400).json({ error: 'tx_ref required' });

    const CHAPA_KEY     = process.env.CHAPA_SECRET_KEY;
    const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const BOT_TOKEN     = process.env.TELEGRAM_BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!CHAPA_KEY) return res.status(500).json({ error: 'CHAPA_SECRET_KEY not configured' });

    // 1. Verify with Chapa
    const verifyRes = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${txRef}`,
      { headers: { 'Authorization': `Bearer ${CHAPA_KEY}` } }
    );
    const verifyData = await verifyRes.json();
    console.log('Chapa verify:', verifyData.status, verifyData.data?.status);

    const isSuccess =
      verifyData.status === 'success' &&
      verifyData.data?.status === 'success';

    // 2. Update order in Supabase + fetch order details
    let orderData = null;
    if (SUPABASE_URL && SUPABASE_KEY) {
      // Update payment status
      await fetch(
        `${SUPABASE_URL}/rest/v1/orders?chapa_reference=eq.${encodeURIComponent(txRef)}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            payment_status: isSuccess ? 'paid' : 'failed',
            order_status: isSuccess ? 'processing' : 'pending',
          }),
        }
      );

      // Fetch order details for notification
      if (isSuccess) {
        const orderRes = await fetch(
          `${SUPABASE_URL}/rest/v1/orders?chapa_reference=eq.${encodeURIComponent(txRef)}&select=*,user:users(first_name,last_name,username,telegram_id),items:order_items(quantity,size,price,product:products(name)),delivery_address`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
          }
        );
        const orders = await orderRes.json();
        orderData = orders?.[0] ?? null;
      }
    }

    // 3. Send Telegram notification to admin
    if (isSuccess && BOT_TOKEN && ADMIN_CHAT_ID && orderData) {
      const addr = orderData.delivery_address;
      const user = orderData.user;
      const items = orderData.items ?? [];

      const itemLines = items
        .map(i => `  • ${i.product?.name ?? 'Product'} (${i.size}) × ${i.quantity} — ETB ${(i.price * i.quantity).toLocaleString()}`)
        .join('\n');

      const addressLine = addr
        ? `\n📍 *Delivery Address*\n  Name: ${addr.full_name}\n  Phone: ${addr.phone}\n  City: ${addr.city}, ${addr.subcity}${addr.woreda ? ', Woreda ' + addr.woreda : ''}${addr.house_number ? ', House ' + addr.house_number : ''}${addr.notes ? '\n  Notes: ' + addr.notes : ''}`
        : '\n📍 No delivery address provided';

      const message = [
        '🛍 *New Order Paid!*',
        '',
        `👤 *Customer*`,
        `  Name: ${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim(),
        user?.username ? `  Telegram: @${user.username}` : `  Telegram ID: ${user?.telegram_id}`,
        '',
        `🧾 *Order #${orderData.id?.slice(0, 8).toUpperCase()}*`,
        `  Total: ETB ${Number(orderData.total).toLocaleString()}`,
        `  Payment: ✅ Paid`,
        '',
        `📦 *Items*`,
        itemLines,
        addressLine,
        '',
        `🔑 tx_ref: \`${txRef}\``,
      ].join('\n');

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      });
    }

    return res.status(200).json({
      status: isSuccess ? 'success' : 'failed',
      reference: txRef,
    });

  } catch (err) {
    console.error('chapa-verify error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
