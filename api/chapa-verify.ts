// Vercel Edge Function — no type imports needed
export default async function handler(req: Request): Promise<Response> {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    let txRef: string | null = null;

    if (req.method === 'GET') {
      txRef = new URL(req.url).searchParams.get('tx_ref');
    } else {
      const body = await req.json().catch(() => ({}));
      txRef = body.txRef ?? body.tx_ref ?? null;
    }

    if (!txRef) {
      return new Response(
        JSON.stringify({ error: 'tx_ref required' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const CHAPA_KEY = process.env.CHAPA_SECRET_KEY;
    if (!CHAPA_KEY) {
      return new Response(
        JSON.stringify({ error: 'CHAPA_SECRET_KEY not configured' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const verifyRes = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${txRef}`,
      { headers: { 'Authorization': `Bearer ${CHAPA_KEY}` } }
    );

    const verifyData = await verifyRes.json();
    const isSuccess =
      verifyData.status === 'success' &&
      verifyData.data?.status === 'success';

    return new Response(
      JSON.stringify({ status: isSuccess ? 'success' : 'failed', reference: txRef }),
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
