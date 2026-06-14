/* eslint-disable */
// @ts-nocheck

async function sendTelegramNotification(botToken, adminChatId, orderData, txRef) {
  const addr = orderData.delivery_address;
  const user = orderData.user;
  const items = orderData.items ?? [];

  const itemLines = items
    .map(i => `  • ${i.product?.name ?? 'Product'} (${i.size}) × ${i.quantity} — ETB ${(i.price * i.quantity).toLocaleString()}`)
    .join('\n') || '  No items found';

  const addressBlock = addr
    ? [
        `📍 *Delivery Address*`,
        `  Name: ${addr.full_name}`,
        `  Phone: ${addr.phone}`,
        `  City: ${addr.city}, ${addr.subcity}${addr.woreda ? ', Woreda ' + addr.woreda : ''}${addr.house_number ? ', House ' + addr.house_number : ''}`,
        addr.notes ? `  Notes: ${addr.notes}` : null,
      ].filter(Boolean).join('\n')
    : '📍 No delivery address provided';

  const customerName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Unknown';
  const customerHandle = user?.username ? `@${user.username}` : `ID: ${user?.telegram_id ?? 'unknown'}`;

  const message = [
    '🛍 *New Order Paid!*',
    '',
    `👤 *Customer*`,
    `  Name: ${customerName}`,
    `  Telegram: ${customerHandle}`,
    '',
    `🧾 *Order \\#${(orderData.id ?? '').slice(0, 8).toUpperCase()}*`,
    `  Total: ETB ${Number(orderData.total).toLocaleString()}`,
    `  Status: ✅ Paid & Processing`,
    '',
    `📦 *Items*`,
    itemLines,
    '',
    addressBlock,
    '',
    `🔑 Ref: \`${txRef}\``,
  ].join('\n');

  const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: adminChatId,
      text: message,
      parse_mode: 'Markdown',
    }),
  });

  const tgData = await tgRes.json();
  if (!tgData.ok) {
    console.error('Telegram notification failed:', JSON.stringify(tgData));
  } else {
    console.log('Telegram notification sent successfully');
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-chapa-signature');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Extract tx_ref from GET params, POST body, or Chapa webhook body
    let txRef = null;

    if (req.method === 'GET') {
      txRef = req.query?.tx_ref;
    } else {
      // Chapa webhook sends: { trx_ref, tx_ref, status, ... }
      txRef = req.body?.tx_ref
        ?? req.body?.trx_ref
        ?? req.body?.txRef
        ?? null;
    }

    console.log('Verify called, tx_ref:', txRef, 'method:', req.method);

    if (!txRef) return res.status(400).json({ error: 'tx_ref required' });

    const CHAPA_KEY     = process.env.CHAPA_SECRET_KEY;
    const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const BOT_TOKEN     = process.env.TELEGRAM_BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!CHAPA_KEY) return res.status(500).json({ error: 'CHAPA_SECRET_KEY not configured' });

    // 1. Verify with Chapa API
    const verifyRes = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${txRef}`,
      { headers: { 'Authorization': `Bearer ${CHAPA_KEY}` } }
    );
    const verifyData = await verifyRes.json();
    console.log('Chapa verify status:', verifyData.status, verifyData.data?.status);

    const isSuccess =
      verifyData.status === 'success' &&
      verifyData.data?.status === 'success';

    // 2. Update order in Supabase
    let orderData = null;
    if (SUPABASE_URL && SUPABASE_KEY) {
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

      // 3. Fetch full order details for notification
      if (isSuccess) {
        const orderRes = await fetch(
          `${SUPABASE_URL}/rest/v1/orders?chapa_reference=eq.${encodeURIComponent(txRef)}&select=id,total,delivery_address,user:users(first_name,last_name,username,telegram_id),items:order_items(quantity,size,price,product:products(name))`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
          }
        );
        const orders = await orderRes.json();
        orderData = Array.isArray(orders) ? orders[0] : null;
        console.log('Order fetched:', orderData ? 'yes' : 'no');
      }
    }

    // 4. Send Telegram notification
    if (isSuccess && BOT_TOKEN && ADMIN_CHAT_ID && orderData) {
      await sendTelegramNotification(BOT_TOKEN, ADMIN_CHAT_ID, orderData, txRef);
    } else if (isSuccess && (!BOT_TOKEN || !ADMIN_CHAT_ID)) {
      console.warn('Telegram vars missing — TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not set in Vercel');
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
