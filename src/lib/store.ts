"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Coupon } from "./types";

export type View =
  | "home"
  | "marketplace"
  | "dashboard";

export type DashboardTab =
  | "customer"
  | "admin";

interface AppState {
  // navigation
  view: View;
  setView: (v: View) => void;

  // search / filter
  query: string;
  setQuery: (q: string) => void;
  category: string; // slug or "all"
  setCategory: (c: string) => void;
  sort: string;
  setSort: (s: string) => void;

  // cart
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (o: boolean) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // coupon
  coupon: Coupon | null;
  discount: number;
  setCoupon: (c: Coupon | null, discount: number) => void;

  // wishlist (product ids)
  wishlist: string[];
  toggleWishlist: (id: string) => void;

  // dashboard
  dashboardTab: DashboardTab;
  setDashboardTab: (t: DashboardTab) => void;

  // customer session (demo, local only)
  customerEmail: string;
  setCustomerEmail: (e: string) => void;

  // checkout modal
  checkoutOpen: boolean;
  setCheckoutOpen: (o: boolean) => void;

  // auth modal
  authOpen: boolean;
  setAuthOpen: (o: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      view: "home",
      setView: (v) => set({ view: v }),

      query: "",
      setQuery: (q) => set({ query: q }),
      category: "all",
      setCategory: (c) => set({ category: c }),
      sort: "popular",
      setSort: (s) => set({ sort: s }),

      cart: [],
      cartOpen: false,
      setCartOpen: (o) => set({ cartOpen: o }),
      addToCart: (item) =>
        set((s) => {
          const existing = s.cart.find((c) => c.productId === item.productId);
          if (existing) {
            return {
              cart: s.cart.map((c) =>
                c.productId === item.productId
                  ? { ...c, quantity: c.quantity + 1 }
                  : c
              ),
            };
          }
          return { cart: [...s.cart, item] };
        }),
      removeFromCart: (productId) =>
        set((s) => ({ cart: s.cart.filter((c) => c.productId !== productId) })),
      clearCart: () => set({ cart: [], coupon: null, discount: 0 }),

      coupon: null,
      discount: 0,
      setCoupon: (c, discount) => set({ coupon: c, discount }),

      wishlist: [],
      toggleWishlist: (id) =>
        set((s) => ({
          wishlist: s.wishlist.includes(id)
            ? s.wishlist.filter((w) => w !== id)
            : [...s.wishlist, id],
        })),

      dashboardTab: "customer",
      setDashboardTab: (t) => set({ dashboardTab: t }),

      customerEmail: "demo@shadowvault.in",
      setCustomerEmail: (e) => set({ customerEmail: e }),

      checkoutOpen: false,
      setCheckoutOpen: (o) => set({ checkoutOpen: o }),

      authOpen: false,
      setAuthOpen: (o) => set({ authOpen: o }),
    }),
    {
      name: "shadowvault-store",
      partialize: (s) => ({
        cart: s.cart,
        wishlist: s.wishlist,
        customerEmail: s.customerEmail,
        dashboardTab: s.dashboardTab,
      }),
    }
  )
);

// derived helpers
export const cartCount = (cart: CartItem[]) =>
  cart.reduce((n, c) => n + c.quantity, 0);
export const cartSubtotal = (cart: CartItem[]) =>
  cart.reduce((n, c) => n + c.price * c.quantity, 0);
