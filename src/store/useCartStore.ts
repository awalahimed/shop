import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocalCartItem, Product, Size } from '@/types';

interface CartState {
  items: LocalCartItem[];
  // Actions
  addItem: (product: Product, size: Size, quantity?: number) => void;
  removeItem: (productId: string, size: Size) => void;
  updateQuantity: (productId: string, size: Size, quantity: number) => void;
  updateSize: (productId: string, oldSize: Size, newSize: Size) => void;
  clearCart: () => void;
  // Derived
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, size, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.product.id === product.id && i.size === size,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id && i.size === size
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { product, size, quantity }] };
        });
      },

      removeItem: (productId, size) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.product.id === productId && i.size === size),
          ),
        }));
      },

      updateQuantity: (productId, size, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId && i.size === size
              ? { ...i, quantity }
              : i,
          ),
        }));
      },

      updateSize: (productId, oldSize, newSize) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId && i.size === oldSize
              ? { ...i, size: newSize }
              : i,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce(
          (sum, i) => sum + i.product.price * i.quantity,
          0,
        ),
    }),
    {
      name: 'union-cart', // localStorage key
    },
  ),
);
