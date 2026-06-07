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

    const CHAPA_KEY = process.env.CHAPA_SECRET_KEY;
    if (!CHAPA_KEY) {
      return res.status(500).json({ error: 'CHAPA_SECRET_KEY not configured' });
    }

    const verifyRes = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${txRef}`,
      { headers: { 'Authorization': `Bearer ${CHAPA_KEY}` } }
    );

    const data = await verifyRes.json();
    const isSuccess = data.status === 'success' && data.data?.status === 'success';

    return res.status(200).json({
      status: isSuccess ? 'success' : 'failed',
      reference: txRef,
    });

  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
