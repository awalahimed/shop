import type { ChapaInitResponse, ChapaVerifyResponse } from '@/types';

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'apikey': SUPABASE_ANON_KEY,
};

/** Initialize Chapa payment — calls chapa-init Edge Function */
export const initializePayment = async (
  orderId: string,
  amount: number,
  email: string,
  firstName: string,
  lastName: string,
): Promise<ChapaInitResponse> => {
  const url = `${SUPABASE_URL}/functions/v1/smooth-function`;
  console.log('Calling chapa-init:', url);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ orderId, amount, email, firstName, lastName }),
    });
  } catch (networkErr) {
    throw new Error(
      `Cannot reach Edge Function. Check your internet connection and that the function is deployed. (${networkErr})`,
    );
  }

  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Edge Function returned non-JSON response (HTTP ${res.status})`);
  }

  console.log('chapa-init response:', data);

  if (!res.ok || data.error) {
    throw new Error(
      typeof data.error === 'string'
        ? data.error
        : `Payment initialization failed (HTTP ${res.status})`,
    );
  }

  if (!data.checkout_url) {
    throw new Error('No checkout URL returned from payment service');
  }

  return data as unknown as ChapaInitResponse;
};

/** Verify Chapa payment — calls chapa-verify Edge Function */
export const verifyPayment = async (
  txRef: string,
): Promise<ChapaVerifyResponse> => {
  const url = `${SUPABASE_URL}/functions/v1/verify-`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ txRef }),
    });
  } catch (networkErr) {
    throw new Error(`Cannot reach verify function: ${networkErr}`);
  }

  const data = await res.json().catch(() => ({})) as Record<string, unknown>;
  console.log('chapa-verify response:', data);

  if (!res.ok || data.error) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Verification failed');
  }

  return data as unknown as ChapaVerifyResponse;
};
