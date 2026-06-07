import type { ChapaInitResponse, ChapaVerifyResponse } from '@/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/**
 * Call the chapa-init Edge Function via direct fetch.
 * Using fetch instead of supabase.functions.invoke gives us
 * full error details from the function response body.
 */
export const initializePayment = async (
  orderId: string,
  amount: number,
  email: string,
  firstName: string,
  lastName: string,
): Promise<ChapaInitResponse> => {
  const url = `${SUPABASE_URL}/functions/v1/chapa-init`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ orderId, amount, email, firstName, lastName }),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error ?? `Edge Function error: ${res.status}`);
  }

  return data as ChapaInitResponse;
};

/**
 * Call the chapa-verify Edge Function via direct fetch.
 */
export const verifyPayment = async (
  txRef: string,
): Promise<ChapaVerifyResponse> => {
  const url = `${SUPABASE_URL}/functions/v1/chapa-verify`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ txRef }),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error ?? `Edge Function error: ${res.status}`);
  }

  return data as ChapaVerifyResponse;
};
