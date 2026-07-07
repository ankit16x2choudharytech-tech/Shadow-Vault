"use client";

import { AnimatePresence, motion } from "framer-motion";
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

  return (
    <div className="relative min-h-screen flex flex-col">
      <LoadingScreen />
      <Background />

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        <main className="flex-1">
          <AnimatePresence mode="wait">
            {view === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Hero />
                <Ticker />
                <Categories />
                <FeaturedProducts />
                <Features />
                <Testimonials />
                <FAQ />
                <Newsletter />
              </motion.div>
            )}

            {view === "marketplace" && (
              <motion.div
                key="marketplace"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Marketplace />
              </motion.div>
            )}

            {view === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Dashboard />
              </motion.div>
            )}
          </AnimatePresence>
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
