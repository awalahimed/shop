// Vercel Serverless Function — no type imports needed
export default async function handler(req: Request): Promise<Response> {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const body = await req.json();
    const { orderId, amount, email, firstName, lastName } = body;

    if (!orderId || !amount || !email) {
      return new Response(
        JSON.stringify({ error: 'orderId, amount, email are required' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const CHAPA_KEY = process.env.CHAPA_SECRET_KEY;
    if (!CHAPA_KEY) {
      return new Response(
        JSON.stringify({ error: 'CHAPA_SECRET_KEY not set in Vercel environment variables' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const APP_URL = 'https://unionshop.vercel.app';
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
      return new Response(
        JSON.stringify({ error: chapaData.message ?? 'Chapa failed', detail: chapaData }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ checkout_url: chapaData.data.checkout_url, tx_ref: txRef }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const config = { runtime: 'edge' };
