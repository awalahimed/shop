import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface RealtimeOrderPayload {
  id: string;
  total: number;
  order_status: string;
  payment_status: string;
  created_at: string;
}

/**
 * Subscribes to real-time INSERT events on the orders table.
 * Calls onNewOrder whenever a new paid order arrives.
 */
export const useRealtimeOrders = (onNewOrder: (order: RealtimeOrderPayload) => void) => {
  const onNewOrderRef = useRef(onNewOrder);
  onNewOrderRef.current = onNewOrder;

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('New order received:', payload.new);
          onNewOrderRef.current(payload.new as RealtimeOrderPayload);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          // Only notify on payment confirmation
          const updated = payload.new as RealtimeOrderPayload;
          if (updated.payment_status === 'paid' && payload.old?.payment_status !== 'paid') {
            onNewOrderRef.current(updated);
          }
        },
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};

/**
 * Generic real-time hook for any table event.
 */
export const useRealtimeTable = (
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  onEvent: (payload: unknown) => void,
) => {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const subscribe = useCallback(() => {
    const channel = supabase
      .channel(`realtime-${table}-${event}`)
      .on(
        'postgres_changes',
        { event, schema: 'public', table },
        (payload) => onEventRef.current(payload),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [table, event]);

  useEffect(() => {
    const unsub = subscribe();
    return unsub;
  }, [subscribe]);
};
