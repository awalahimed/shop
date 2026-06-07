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
    const txRef = `union-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const chapaRes = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHAPA_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(amount),
        currency: 'ETB',
        email,
        first_name: firstName || 'Customer',
        last_name: lastName || 'User',
        tx_ref: txRef,
        return_url: `${APP_URL}/orders?tx_ref=${txRef}`,
        customization: { title: 'Union Shop' },
      }),
    });

    const data = await chapaRes.json();

    if (data.status !== 'success') {
      return res.status(500).json({ error: data.message ?? 'Chapa failed', detail: data });
    }

    return res.status(200).json({ checkout_url: data.data.checkout_url, tx_ref: txRef });

  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
