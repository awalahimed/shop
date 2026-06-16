/* eslint-disable */
// @ts-nocheck

/** Send order notification to ADMIN — uses plain Markdown for reliability */
async function notifyAdmin(botToken, adminChatId, orderData, txRef) {
  const addr  = orderData.delivery_address;
  const user  = orderData.user;
  const items = orderData.items ?? [];

  const customerName   = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Unknown';
  const customerHandle = user?.username ? `@${user.username}` : `Telegram ID: ${user?.telegram_id ?? 'N/A'}`;

  const itemLines = items.length > 0
    ? items.map(i => `• ${i.product?.name ?? 'Product'} (${i.size}) x${i.quantity} = ETB ${(i.price * i.quantity).toLocaleString()}`).join('\n')
    : '• No items';

  const addressBlock = addr
    ? [
        `Name: ${addr.full_name}`,
        `Phone: ${addr.phone}`,
        `City: ${addr.city}, ${addr.subcity}${addr.woreda ? ', Woreda ' + addr.woreda : ''}${addr.house_number ? ', House ' + addr.house_number : ''}`,
        addr.notes ? `Notes: ${addr.notes}` : null,
      ].filter(Boolean).join('\n')
    : 'No address provided';

  const message = `🛍 *New Order Paid!*

👤 *Customer Details*
Name: ${customerName}
Telegram: ${customerHandle}

🧾 *Order #${(orderData.id ?? '').slice(0,8).toUpperCase()}*
Total: ETB ${Number(orderData.total).toLocaleString()}
Status: ✅ Paid & Processing

📦 *Items Ordered*
${itemLines}

📍 *Delivery Address*
${addressBlock}

🔑 Reference: ${txRef}`;

  console.log('Sending admin notification to chat ID:', adminChatId);

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: adminChatId,
      text: message,
      parse_mode: 'Markdown',
    }),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error('Admin notify FAILED:', JSON.stringify(data));
  } else {
    console.log('Admin notified successfully ✓ message_id:', data.result?.message_id);
  }
  return data.ok;
}

/** Send order confirmation to CUSTOMER */
async function notifyCustomer(botToken, orderData, txRef) {
  const user  = orderData.user;
  const addr  = orderData.delivery_address;
  const items = orderData.items ?? [];

  if (!user?.telegram_id) {
    console.warn('Customer has no telegram_id, skipping customer notification');
    return;
  }

  const firstName = user.first_name ?? 'there';
  const orderId   = (orderData.id ?? '').slice(0, 8).toUpperCase();

  const itemLines = items.length > 0
    ? items.map((i, idx) => `${idx + 1}. *${i.product?.name ?? 'Product'}*\n   Size: ${i.size} · Qty: ${i.quantity} · ETB ${(i.price * i.quantity).toLocaleString()}`).join('\n\n')
    : '• No items';

  const addressBlock = addr
    ? `📍 *Delivery Address*\n👤 ${addr.full_name}\n📞 ${addr.phone}\n🏙 ${addr.city}, ${addr.subcity}${addr.woreda ? ', Woreda ' + addr.woreda : ''}${addr.house_number ? ', House ' + addr.house_number : ''}${addr.notes ? '\n📝 ' + addr.notes : ''}`
    : '';

  const message = `✅ *Order Confirmed!*

Hello ${firstName}! Your payment was successful and your order is now being processed.

━━━━━━━━━━━━━━━
🧾 *Order #${orderId}*
💰 Total: ETB ${Number(orderData.total).toLocaleString()}
━━━━━━━━━━━━━━━

📦 *Your Items*
${itemLines}

${addressBlock}

━━━━━━━━━━━━━━━
We will send you a message when your order is shipped 🚚

Thank you for shopping at *Union Shop* 🛍`;

  console.log('Sending customer confirmation to telegram_id:', user.telegram_id);

  const msgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: user.telegram_id,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
  });

  const msgData = await msgRes.json();
  if (!msgData.ok) {
    console.error('Customer confirmation FAILED:', JSON.stringify(msgData));
  } else {
    console.log('Customer confirmation sent ✓ message_id:', msgData.result?.message_id);
  }

  // Send product images as media group
  const imageItems = items.filter(i => i.product?.image_url).slice(0, 10);
  if (imageItems.length > 0) {
    const media = imageItems.map((i, idx) => ({
      type: 'photo',
      media: i.product.image_url,
      ...(idx === 0 ? { caption: `Your order from Union Shop 🛍\nOrder #${orderId}` } : {}),
    }));

    const photoRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMediaGroup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: user.telegram_id, media }),
    });

    const photoData = await photoRes.json();
    if (!photoData.ok) {
      console.error('Product photos FAILED:', JSON.stringify(photoData));
    } else {
      console.log('Product photos sent ✓');
    }
  }
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

    console.log('=== chapa-verify called ===');
    console.log('tx_ref:', txRef, '| method:', req.method);
    if (!txRef) return res.status(400).json({ error: 'tx_ref required' });

    const CHAPA_KEY     = process.env.CHAPA_SECRET_KEY;
    const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const BOT_TOKEN     = process.env.TELEGRAM_BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

    console.log('Config check — CHAPA_KEY:', !!CHAPA_KEY, '| SUPABASE_URL:', !!SUPABASE_URL, '| BOT_TOKEN:', !!BOT_TOKEN, '| ADMIN_CHAT_ID:', ADMIN_CHAT_ID);

    if (!CHAPA_KEY) return res.status(500).json({ error: 'CHAPA_SECRET_KEY not configured' });

    // 1. Verify payment with Chapa
    const verifyRes = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${txRef}`,
      { headers: { Authorization: `Bearer ${CHAPA_KEY}` } }
    );
    const verifyData = await verifyRes.json();
    console.log('Chapa verify result:', verifyData.status, '|', verifyData.data?.status);

    const isSuccess =
      verifyData.status === 'success' &&
      verifyData.data?.status === 'success';

    // 2. Update order status in Supabase
    let orderData = null;
    if (SUPABASE_URL && SUPABASE_KEY) {
      const patchRes = await fetch(
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
      console.log('DB update status:', patchRes.status);

      // 3. Fetch full order with customer + items + images
      if (isSuccess) {
        const orderRes = await fetch(
          `${SUPABASE_URL}/rest/v1/orders?chapa_reference=eq.${encodeURIComponent(txRef)}&select=id,total,delivery_address,user:users(first_name,last_name,username,telegram_id),items:order_items(quantity,size,price,product:products(name,image_url))`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        );
        const orders = await orderRes.json();
        orderData = Array.isArray(orders) ? orders[0] : null;
        console.log('Order data fetched:', orderData ? `id=${orderData.id?.slice(0,8)}` : 'NOT FOUND');
        if (orderData) {
          console.log('Customer telegram_id:', orderData.user?.telegram_id);
          console.log('Items count:', orderData.items?.length ?? 0);
          console.log('Address:', orderData.delivery_address ? 'present' : 'missing');
        }
      }
    }

    // 4. Send notifications
    if (isSuccess && BOT_TOKEN && orderData) {
      const results = await Promise.allSettled([
        // Admin gets full order details
        ADMIN_CHAT_ID
          ? notifyAdmin(BOT_TOKEN, ADMIN_CHAT_ID, orderData, txRef)
          : Promise.resolve(false),
        // Customer gets order confirmation + product photos
        notifyCustomer(BOT_TOKEN, orderData, txRef),
      ]);

      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`Notification ${i === 0 ? 'admin' : 'customer'} threw:`, r.reason);
        }
      });
    } else if (isSuccess && !BOT_TOKEN) {
      console.warn('TELEGRAM_BOT_TOKEN not set — skipping notifications');
    } else if (isSuccess && !orderData) {
      console.warn('Order data not found — skipping notifications');
    }

    return res.status(200).json({
      status: isSuccess ? 'success' : 'failed',
      reference: txRef,
    });

  } catch (err) {
    console.error('chapa-verify unhandled error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
