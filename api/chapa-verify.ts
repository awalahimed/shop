/* eslint-disable */
// @ts-nocheck

/** Send order confirmation to ADMIN */
async function notifyAdmin(botToken, adminChatId, orderData, txRef) {
  const addr  = orderData.delivery_address;
  const user  = orderData.user;
  const items = orderData.items ?? [];

  const itemLines = items
    .map(i => `  • ${i.product?.name ?? 'Product'} (${i.size}) × ${i.quantity} — ETB ${(i.price * i.quantity).toLocaleString()}`)
    .join('\n') || '  No items';

  const addressBlock = addr
    ? [`📍 *Delivery Address*`,
       `  ${addr.full_name} · ${addr.phone}`,
       `  ${addr.city}, ${addr.subcity}${addr.woreda ? ', Woreda ' + addr.woreda : ''}${addr.house_number ? ', House ' + addr.house_number : ''}`,
       addr.notes ? `  Note: ${addr.notes}` : null,
      ].filter(Boolean).join('\n')
    : '📍 No delivery address';

  const customerName   = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Unknown';
  const customerHandle = user?.username ? `@${user.username}` : `ID: ${user?.telegram_id}`;

  const msg = [
    '🛍 *New Order Paid\\!*',
    '',
    `👤 *Customer:* ${customerName} \\(${customerHandle}\\)`,
    '',
    `🧾 *Order \\#${(orderData.id ?? '').slice(0,8).toUpperCase()}*`,
    `  Total: *ETB ${Number(orderData.total).toLocaleString()}*`,
    `  Status: ✅ Paid & Processing`,
    '',
    `📦 *Items*`,
    itemLines,
    '',
    addressBlock,
    '',
    `🔑 Ref: \`${txRef}\``,
  ].join('\n');

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: adminChatId, text: msg, parse_mode: 'MarkdownV2' }),
  });
  const data = await res.json();
  if (!data.ok) console.error('Admin notify failed:', data.description);
  else console.log('Admin notified ✓');
}

/** Send beautiful order confirmation to CUSTOMER */
async function notifyCustomer(botToken, orderData, txRef) {
  const user  = orderData.user;
  const addr  = orderData.delivery_address;
  const items = orderData.items ?? [];

  if (!user?.telegram_id) return;

  const firstName = user.first_name ?? 'there';
  const orderId   = (orderData.id ?? '').slice(0, 8).toUpperCase();

  // Build item lines with product image (send photos separately)
  const itemLines = items
    .map((i, idx) => `${idx + 1}\\. *${escapeMarkdown(i.product?.name ?? 'Product')}*\n   Size: ${i.size} · Qty: ${i.quantity} · ETB ${(i.price * i.quantity).toLocaleString()}`)
    .join('\n\n') || 'No items';

  const addressLines = addr
    ? [
        `📍 *Delivery Details*`,
        `👤 ${escapeMarkdown(addr.full_name)}`,
        `📞 ${escapeMarkdown(addr.phone)}`,
        `🏙 ${escapeMarkdown(addr.city)}, ${escapeMarkdown(addr.subcity)}${addr.woreda ? `, Woreda ${addr.woreda}` : ''}${addr.house_number ? `, House ${addr.house_number}` : ''}`,
        addr.notes ? `📝 _${escapeMarkdown(addr.notes)}_` : null,
      ].filter(Boolean).join('\n')
    : '';

  const msg = [
    `✅ *Payment Confirmed\\!*`,
    '',
    `Hello ${escapeMarkdown(firstName)}\\! Your order has been received and is being processed\\.`,
    '',
    `━━━━━━━━━━━━━━━`,
    `🧾 *Order \\#${orderId}*`,
    `💰 Total: *ETB ${Number(orderData.total).toLocaleString()}*`,
    `━━━━━━━━━━━━━━━`,
    '',
    `📦 *Your Items*`,
    itemLines,
    '',
    addressLines,
    '',
    `━━━━━━━━━━━━━━━`,
    `We will notify you when your order is shipped\\. 🚚`,
    '',
    `Thank you for shopping at *Union Shop* 🛍`,
    `[Open Shop](https://t.me/ahimed_shop_bot/shop)`,
  ].filter(s => s !== undefined).join('\n');

  // Send the main confirmation message
  const msgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: user.telegram_id,
      text: msg,
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true,
    }),
  });
  const msgData = await msgRes.json();
  if (!msgData.ok) console.error('Customer msg failed:', msgData.description);
  else console.log('Customer confirmation sent ✓');

  // Send product images as a media group (up to 10)
  const imageItems = items.filter(i => i.product?.image_url).slice(0, 10);
  if (imageItems.length > 0) {
    const media = imageItems.map((i, idx) => ({
      type: 'photo',
      media: i.product.image_url,
      caption: idx === 0
        ? `Your order items from Union Shop 🛍`
        : undefined,
    }));

    const photoRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMediaGroup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: user.telegram_id, media }),
    });
    const photoData = await photoRes.json();
    if (!photoData.ok) console.error('Product photos failed:', photoData.description);
    else console.log('Product photos sent ✓');
  }
}

/** Escape special chars for MarkdownV2 */
function escapeMarkdown(text) {
  if (!text) return '';
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-chapa-signature');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let txRef = null;
    if (req.method === 'GET') {
      txRef = req.query?.tx_ref;
    } else {
      txRef = req.body?.tx_ref ?? req.body?.trx_ref ?? req.body?.txRef ?? null;
    }

    console.log('Verify called, tx_ref:', txRef, 'method:', req.method);
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
      { headers: { Authorization: `Bearer ${CHAPA_KEY}` } }
    );
    const verifyData = await verifyRes.json();
    console.log('Chapa verify:', verifyData.status, verifyData.data?.status);

    const isSuccess =
      verifyData.status === 'success' &&
      verifyData.data?.status === 'success';

    // 2. Update order in DB
    let orderData = null;
    if (SUPABASE_URL && SUPABASE_KEY) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/orders?chapa_reference=eq.${encodeURIComponent(txRef)}`,
        {
          method: 'PATCH',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            payment_status: isSuccess ? 'paid' : 'failed',
            order_status:   isSuccess ? 'processing' : 'pending',
          }),
        }
      );

      // 3. Fetch full order details
      if (isSuccess) {
        const orderRes = await fetch(
          `${SUPABASE_URL}/rest/v1/orders?chapa_reference=eq.${encodeURIComponent(txRef)}&select=id,total,delivery_address,user:users(first_name,last_name,username,telegram_id),items:order_items(quantity,size,price,product:products(name,image_url))`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        );
        const orders = await orderRes.json();
        orderData = Array.isArray(orders) ? orders[0] : null;
        console.log('Order fetched for notifications:', orderData ? 'yes' : 'no');
      }
    }

    // 4. Send both notifications in parallel
    if (isSuccess && BOT_TOKEN && orderData) {
      const promises = [];

      // Admin notification
      if (ADMIN_CHAT_ID) {
        promises.push(notifyAdmin(BOT_TOKEN, ADMIN_CHAT_ID, orderData, txRef));
      }

      // Customer confirmation + product photos
      promises.push(notifyCustomer(BOT_TOKEN, orderData, txRef));

      await Promise.allSettled(promises);
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
