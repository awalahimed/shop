// ─── Database / Domain Types ────────────────────────────────────────────────

export type Size = 'S' | 'M' | 'L' | 'XL';

export interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
  images: string[];       // additional images
  featured: boolean;
  created_at: string;
  sizes?: ProductSize[];  // joined from product_sizes
}

export interface ProductSize {
  id: string;
  product_id: string;
  size: Size;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  size: Size;
  quantity: number;
  product?: Product;      // joined
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  payment_status: 'pending' | 'paid' | 'failed';
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  chapa_reference: string | null;
  created_at: string;
  items?: OrderItem[];    // joined
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  size: Size;
  quantity: number;
  price: number;
  product?: Product;      // joined
}

// ─── Cart (local state) ──────────────────────────────────────────────────────

export interface LocalCartItem {
  product: Product;
  size: Size;
  quantity: number;
}

// ─── API / Supabase helpers ──────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// ─── Chapa ───────────────────────────────────────────────────────────────────

export interface ChapaInitResponse {
  checkout_url: string;
  tx_ref: string;
}

export interface ChapaVerifyResponse {
  status: 'success' | 'failed';
  reference: string;
}

// ─── Telegram WebApp ─────────────────────────────────────────────────────────

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}
