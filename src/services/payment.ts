import type { ChapaInitResponse, ChapaVerifyResponse } from '@/types';

// Use Vercel API routes — no Edge Function needed
const BASE = '';  // same origin, relative URLs

export const initializePayment = async (
  orderId: string,
  amount: number,
  email: string,
  firstName: string,
  lastName: string,
): Promise<ChapaInitResponse> => {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/chapa-init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount, email, firstName, lastName }),
    });
  } catch (e) {
    throw new Error(`Network error calling payment API: ${e}`);
  }

  const data = await res.json().catch(() => ({}));
  console.log('chapa-init response:', data);

  if (!res.ok || data.error) {
    throw new Error(typeof data.error === 'string' ? data.error : `Payment failed (HTTP ${res.status})`);
  }

  return data as ChapaInitResponse;
};

export const verifyPayment = async (txRef: string): Promise<ChapaVerifyResponse> => {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/chapa-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txRef }),
    });
  } catch (e) {
    throw new Error(`Network error calling verify API: ${e}`);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Verification failed');
  }

  return data as ChapaVerifyResponse;
};
