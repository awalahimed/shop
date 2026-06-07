/* eslint-disable */
// @ts-nocheck
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { orderId, amount, email, firstName, lastName } = req.body;

    if (!orderId || !amount || !email) {
      return res.status(400).json({ error: 'orderId, amount, email are required' });
    }

    const CHAPA_KEY = process.env.CHAPA_SECRET_KEY;
    if (!CHAPA_KEY) {
      return res.status(500).json({ error: 'CHAPA_SECRET_KEY not set in Vercel Environment Variables' });
    }

    const APP_URL = 'https://unionshop.vercel.app';
    // Use timestamp + random to ensure unique tx_ref every time
    const txRef = `union${Date.now()}${Math.floor(Math.random() * 9999)}`;

    // Ensure amount is a number and at least 1
    const numAmount = Math.max(1, parseFloat(String(amount)));

    const chapaPayload = {
      amount: numAmount.toFixed(2),
      currency: 'ETB',
      email: email,
      first_name: (firstName || 'Customer').slice(0, 50),
      last_name: (lastName || 'User').slice(0, 50),
      tx_ref: txRef,
      return_url: `${APP_URL}/orders?tx_ref=${txRef}`,
      customization: {
        title: 'Union Shop',
        description: 'Order payment',
      },
    };

    console.log('Sending to Chapa:', JSON.stringify(chapaPayload));

    const chapaRes = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHAPA_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chapaPayload),
    });

    const data = await chapaRes.json();
    console.log('Chapa response:', chapaRes.status, JSON.stringify(data));

    if (data.status !== 'success') {
      return res.status(500).json({
        error: data.message ?? 'Chapa payment initialization failed',
        chapa_status: chapaRes.status,
        chapa_detail: data,
      });
    }

    return res.status(200).json({
      checkout_url: data.data.checkout_url,
      tx_ref: txRef,
    });

  } catch (err) {
    console.error('chapa-init crash:', err);
    return res.status(500).json({ error: String(err) });
  }
}
