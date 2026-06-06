import { supabase } from '@/lib/supabase';
import type { ChapaInitResponse, ChapaVerifyResponse } from '@/types';

/**
 * Call the Supabase Edge Function to initialize a Chapa payment.
 * Returns the checkout URL and transaction reference.
 */
export const initializePayment = async (
  orderId: string,
  amount: number,
  email: string,
  firstName: string,
  lastName: string,
): Promise<ChapaInitResponse> => {
  const { data, error } = await supabase.functions.invoke('chapa-init', {
    body: { orderId, amount, email, firstName, lastName },
  });

  if (error) throw new Error(error.message);
  return data as ChapaInitResponse;
};

/**
 * Call the Supabase Edge Function to verify a Chapa payment.
 * The Edge Function updates the order's payment_status in the DB.
 */
export const verifyPayment = async (
  txRef: string,
): Promise<ChapaVerifyResponse> => {
  const { data, error } = await supabase.functions.invoke('chapa-verify', {
    body: { txRef },
  });

  if (error) throw new Error(error.message);
  return data as ChapaVerifyResponse;
};
