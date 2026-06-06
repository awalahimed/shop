import { supabase } from '@/lib/supabase';
import type { Order, LocalCartItem } from '@/types';

/** Create a pending order from cart items */
export const createOrder = async (
  userId: string,
  items: LocalCartItem[],
  total: number,
): Promise<Order> => {
  // 1. Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      total,
      payment_status: 'pending',
      order_status: 'pending',
    })
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  // 2. Insert order items
  const orderItems = items.map((i) => ({
    order_id: order.id,
    product_id: i.product.id,
    size: i.size,
    quantity: i.quantity,
    price: i.product.price,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) throw new Error(itemsError.message);

  return order as Order;
};

/** Fetch user orders with items and products */
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `*, items:order_items(
        id, order_id, size, quantity, price,
        product:products(id, name, image_url, price)
      )`,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Order[]) ?? [];
};

/** Fetch single order */
export const getOrder = async (orderId: string): Promise<Order> => {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `*, items:order_items(
        id, order_id, size, quantity, price,
        product:products(id, name, image_url, price)
      )`,
    )
    .eq('id', orderId)
    .single();

  if (error) throw new Error(error.message);
  return data as Order;
};

/** Admin: fetch all orders */
export const getAllOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `*, user:users(id, first_name, last_name, username),
       items:order_items(id, size, quantity, price, product:products(name))`,
    )
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Order[]) ?? [];
};

/** Admin: update order status */
export const updateOrderStatus = async (
  orderId: string,
  orderStatus: Order['order_status'],
): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({ order_status: orderStatus })
    .eq('id', orderId);

  if (error) throw new Error(error.message);
};
