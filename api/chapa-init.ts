import type { IncomingMessage, ServerResponse } from 'node:http';

type Req = IncomingMessage & { body?: Record<string, unknown>; query?: Record<string, string> };
type Res = ServerResponse & {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
  setHeader: (key: string, value: string) => void;
};

export default async function handler(req: Req, res: Res) {
  // CORS
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
      return res.status(500).json({ error: 'CHAPA_SECRET_KEY not configured in Vercel env vars' });
    }

    const APP_URL = process.env.VITE_APP_URL ?? 'https://unionshop.vercel.app';
    const txRef = `union-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

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

    const chapaData = await chapaRes.json();

    if (chapaData.status !== 'success') {
      console.error('Chapa error:', JSON.stringify(chapaData));
      return res.status(500).json({
        error: chapaData.message ?? 'Chapa payment initialization failed',
        detail: chapaData,
      });
    }

    return res.status(200).json({
      checkout_url: chapaData.data.checkout_url,
      tx_ref: txRef,
      order_id: orderId,
    });

  } catch (err) {
    console.error('chapa-init error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
