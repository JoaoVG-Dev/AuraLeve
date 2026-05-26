import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "./types";

interface ShopState {
  cart: CartItem[];
  addToCart: (productId: string, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clearCart: () => void;
}

export const useShop = create<ShopState>()(
  persist(
    (set) => ({
      cart: [],
      addToCart: (productId, qty = 1) =>
        set((s) => {
          const safeQty = Math.min(99, Math.max(1, Math.floor(qty)));
          const existing = s.cart.find((c) => c.productId === productId);
          if (existing) {
            return {
              cart: s.cart.map((c) =>
                c.productId === productId
                  ? { ...c, quantity: Math.min(99, c.quantity + safeQty) }
                  : c,
              ),
            };
          }
          return { cart: [...s.cart, { productId, quantity: safeQty }] };
        }),
      removeFromCart: (productId) =>
        set((s) => ({ cart: s.cart.filter((c) => c.productId !== productId) })),
      setQty: (productId, qty) =>
        set((s) => ({
          cart: s.cart
            .map((c) =>
              c.productId === productId
                ? { ...c, quantity: Math.min(99, Math.floor(qty)) }
                : c,
            )
            .filter((c) => c.quantity > 0),
        })),
      clearCart: () => set({ cart: [] }),
    }),
    { name: "auraleve-cart-v2" },
  ),
);

export const WHATSAPP = "5511999990000";
export const INSTAGRAM = "https://instagram.com/auraleve.japamalas";
