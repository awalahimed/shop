import type { IncomingMessage, ServerResponse } from 'node:http';

type Req = IncomingMessage & { body?: Record<string, unknown>; query?: Record<string, string> };
type Res = ServerResponse & {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
  setHeader: (key: string, value: string) => void;
};

export default async function handler(req: Req, res: Res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const txRef = req.method === 'GET'
      ? req.query.tx_ref as string
      : req.body?.txRef ?? req.body?.tx_ref;

    if (!txRef) return res.status(400).json({ error: 'tx_ref required' });

    const CHAPA_KEY = process.env.CHAPA_SECRET_KEY;
    if (!CHAPA_KEY) {
      return res.status(500).json({ error: 'CHAPA_SECRET_KEY not configured' });
    }

    const verifyRes = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${txRef}`,
      { headers: { 'Authorization': `Bearer ${CHAPA_KEY}` } }
    );

    const verifyData = await verifyRes.json();
    const isSuccess = verifyData.status === 'success' && verifyData.data?.status === 'success';

    return res.status(200).json({
      status: isSuccess ? 'success' : 'failed',
      reference: txRef,
    });

  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
