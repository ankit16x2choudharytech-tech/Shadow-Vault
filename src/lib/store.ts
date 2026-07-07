"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Coupon } from "./types";

export type View =
  | "home"
  | "marketplace"
  | "dashboard";

export type UserRole = "customer" | "admin" | null;

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

  // session / auth
  userRole: UserRole;
  userName: string | null;
  customerEmail: string;
  login: (role: "customer" | "admin", name: string, email: string) => void;
  logout: () => void;
  setCustomerEmail: (e: string) => void;

  // checkout modal
  checkoutOpen: boolean;
  setCheckoutOpen: (o: boolean) => void;

  // auth modal
  authOpen: boolean;
  authRole: "customer" | "admin" | null; // which role the auth modal is signing in as
  setAuthOpen: (o: boolean, role?: "customer" | "admin") => void;

  // hydration flag (true once persisted state is loaded from localStorage)
  _hasHydrated: boolean;
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

      // session — default logged-out
      userRole: null,
      userName: null,
      customerEmail: "demo@shadowvault.in",
      login: (role, name, email) =>
        set({
          userRole: role,
          userName: name,
          customerEmail: email,
        }),
      logout: () =>
        set({ userRole: null, userName: null }),
      setCustomerEmail: (e) => set({ customerEmail: e }),

      checkoutOpen: false,
      setCheckoutOpen: (o) => set({ checkoutOpen: o }),

      authOpen: false,
      authRole: "customer",
      setAuthOpen: (o, role) =>
        set({ authOpen: o, authRole: role ?? get().authRole }),

      // hydration flag — false on server & first client render, true after
      // persisted state is rehydrated from localStorage
      _hasHydrated: false,
    }),
    {
      name: "shadowvault-store",
      // CRITICAL: skip auto-rehydration so the store stays in default state
      // during SSR and the first client render (matching the server). We
      // manually trigger rehydration in a useEffect (see useHydrated) AFTER
      // React has committed the initial render. This prevents hydration
      // mismatches that would otherwise break React event handlers.
      skipHydration: true,
      partialize: (s) => ({
        cart: s.cart,
        wishlist: s.wishlist,
        customerEmail: s.customerEmail,
        userRole: s.userRole,
        userName: s.userName,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      },
    }
  )
);

/**
 * Returns false during SSR and the very first client render, then triggers
 * rehydration of the persisted store and returns true once complete. Gate any
 * UI that depends on persisted state (userRole, cart, wishlist) on this to
 * avoid hydration mismatches that can break React event handlers.
 */
export function useHydrated(): boolean {
  const hydrated = useStore((s) => s._hasHydrated);
  useEffect(() => {
    if (!hydrated) {
      void useStore.persist.rehydrate();
    }
  }, [hydrated]);
  return hydrated;
}

// derived helpers
export const cartCount = (cart: CartItem[]) =>
  cart.reduce((n, c) => n + c.quantity, 0);
export const cartSubtotal = (cart: CartItem[]) =>
  cart.reduce((n, c) => n + c.price * c.quantity, 0);
