"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { Background } from "@/components/shadowvault/background";
import { Navbar } from "@/components/shadowvault/navbar";
import { LoadingScreen } from "@/components/shadowvault/loading-screen";
import { Hero, Ticker } from "@/components/shadowvault/hero";
import { Categories } from "@/components/shadowvault/categories";
import { FeaturedProducts } from "@/components/shadowvault/featured-products";
import { Features } from "@/components/shadowvault/features";
import { Testimonials } from "@/components/shadowvault/testimonials";
import { FAQ } from "@/components/shadowvault/faq";
import { Newsletter } from "@/components/shadowvault/newsletter";
import { Footer } from "@/components/shadowvault/footer";
import { Marketplace } from "@/components/shadowvault/marketplace";
import { Dashboard } from "@/components/shadowvault/dashboard";
import { CartDrawer } from "@/components/shadowvault/cart-drawer";
import { CheckoutModal } from "@/components/shadowvault/checkout-modal";
import { AuthModal } from "@/components/shadowvault/auth-modal";
import { LegalModal } from "@/components/shadowvault/legal-modal";

export default function Home() {
  const { view, rehydrate } = useStore();

  // Rehydrate persisted state from localStorage after mount. The server and
  // first client render both use default state (no localStorage), so there's
  // no hydration mismatch. After rehydrate, components re-render with actual
  // persisted state (login, cart, wishlist).
  useEffect(() => {
    void useStore.persist.rehydrate();
    // Verify the persisted session against the server (httpOnly JWT cookie).
    // If the cookie is valid, sync the store with the real user. If invalid
    // (e.g. cookie expired), log out locally. This keeps refresh behavior
    // consistent with the real auth backend.
    void (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          const u = json.data ?? json;
          if (u && u.role) {
            rehydrate(u.role, u.name, u.email);
          }
        } else {
          // cookie invalid/expired — clear local session
          rehydrate(null, null, "demo@shadowvault.in");
        }
      } catch {
        // network error — keep persisted state as-is
      }
    })();
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col">
      <LoadingScreen />
      <Background />

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        <main className="flex-1">
          {view === "home" && (
            <div key="home" className="animate-float-up">
              <Hero />
              <Ticker />
              <Categories />
              <FeaturedProducts />
              <Features />
              <Testimonials />
              <FAQ />
              <Newsletter />
            </div>
          )}

          {view === "marketplace" && (
            <div key="marketplace" className="animate-float-up">
              <Marketplace />
            </div>
          )}

          {view === "dashboard" && (
            <div key="dashboard" className="animate-float-up">
              <Dashboard />
            </div>
          )}
        </main>

        <Footer />
      </div>

      {/* Overlays */}
      <CartDrawer />
      <CheckoutModal />
      <AuthModal />
      <LegalModal />
    </div>
  );
}
