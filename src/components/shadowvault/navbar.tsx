"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Vault,
  LayoutDashboard,
  Store,
  Shield,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useStore, cartCount } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const {
    view,
    setView,
    setQuery,
    query,
    cart,
    setCartOpen,
    setAuthOpen,
    wishlist,
  } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (v: typeof view) => {
    setView(v);
    setMobileOpen(false);
    if (v === "marketplace") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(localQuery);
    setView("marketplace");
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navItems = [
    { id: "home" as const, label: "Home", icon: Vault },
    { id: "marketplace" as const, label: "Marketplace", icon: Store },
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  ];

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass-strong border-b border-white/10 shadow-2xl shadow-black/40"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => go("home")}
            className="flex items-center gap-2 group shrink-0"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--neon-violet)] blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--neon-violet)] to-[var(--neon-pink)] glow-violet">
                <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-lg tracking-tight">
                Shadow<span className="text-gradient">Vault</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground hidden sm:block">
                Secure Digital Delivery
              </span>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    active
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-white/8 border border-white/10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Search (desktop) */}
          <form
            onSubmit={submitSearch}
            className="hidden lg:flex flex-1 max-w-xs relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search panels, mods, configs…"
              className="pl-9 bg-white/5 border-white/10 focus-visible:border-[var(--neon-violet)]/50 focus-visible:ring-[var(--neon-violet)]/20 h-9"
            />
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCartOpen(true)}
              className="relative h-9 w-9 rounded-lg hover:bg-white/10"
              aria-label="Open cart"
            >
              <ShoppingCart className="h-5 w-5" />
              <AnimatePresence>
                {cart.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 grid h-4 min-w-[18px] px-1 place-items-center rounded-full bg-[var(--neon-pink)] text-[10px] font-bold text-white"
                  >
                    {cartCount(cart)}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView("dashboard")}
              className="relative h-9 w-9 rounded-lg hover:bg-white/10 hidden sm:flex"
              aria-label="Wishlist"
            >
              <User className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 grid h-4 min-w-16 px-1 place-items-center rounded-full bg-[var(--neon-amber)] text-[9px] font-bold text-black">
                  {wishlist.length}
                </span>
              )}
            </Button>

            <Button
              onClick={() => setAuthOpen(true)}
              size="sm"
              className="hidden sm:inline-flex btn-magnetic bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0 hover:opacity-90 glow-violet"
            >
              Sign In
            </Button>

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9 rounded-lg"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="glass-strong border-white/10 w-[300px]"
              >
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[var(--neon-violet)]" />
                    ShadowVault
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-3">
                  <form onSubmit={submitSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={localQuery}
                      onChange={(e) => setLocalQuery(e.target.value)}
                      placeholder="Search…"
                      className="pl-9 bg-white/5 border-white/10"
                    />
                  </form>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => go(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          view === item.id
                            ? "bg-white/10 text-white"
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                  <Button
                    onClick={() => {
                      setAuthOpen(true);
                      setMobileOpen(false);
                    }}
                    className="w-full btn-magnetic bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0"
                  >
                    Sign In
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
