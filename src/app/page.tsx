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

export default function Home() {
  const { view } = useStore();

  // Rehydrate persisted state from localStorage after mount. The server and
  // first client render both use default state (no localStorage), so there's
  // no hydration mismatch. After rehydrate, components re-render with actual
  // persisted state (login, cart, wishlist).
  useEffect(() => {
    void useStore.persist.rehydrate();
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
    </div>
  );
}
