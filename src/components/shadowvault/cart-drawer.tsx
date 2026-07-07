"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  X,
  Trash2,
  Plus,
  Minus,
  Tag,
  Loader2,
  ShieldCheck,
  ArrowRight,
  Ticket,
} from "lucide-react";
import { useStore, cartSubtotal } from "@/lib/store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { CouponValidationResult } from "@/lib/types";

export function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    removeFromCart,
    coupon,
    discount,
    setCoupon,
    setCheckoutOpen,
    customerEmail,
  } = useStore();

  const [couponInput, setCouponInput] = useState("");
  const [validating, setValidating] = useState(false);

  const subtotal = cartSubtotal(cart);
  const tax = Math.round(subtotal * 0.18); // 18% GST
  const total = Math.max(0, subtotal + tax - discount);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidating(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim().toUpperCase(), subtotal }),
      });
      const json: CouponValidationResult = await res.json();
      if (json.valid) {
        setCoupon(json.coupon ?? null, json.discount ?? 0);
        toast.success(`Coupon applied — you saved ₹${json.discount}`);
      } else {
        setCoupon(null, 0);
        toast.error(json.message ?? "Invalid coupon");
      }
    } catch {
      toast.error("Could not validate coupon");
    } finally {
      setValidating(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null, 0);
    setCouponInput("");
    toast.success("Coupon removed");
  };

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent
        side="right"
        className="glass-strong border-white/10 w-full sm:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="p-5 border-b border-white/10">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[var(--neon-violet)]" />
            Your Cart
            <span className="text-sm font-normal text-muted-foreground">
              ({cart.length})
            </span>
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-2xl glass mb-4">
              <ShoppingCart className="h-9 w-9 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Browse the marketplace and add premium products to get started.
            </p>
            <Button
              onClick={() => {
                setCartOpen(false);
                useStore.getState().setView("marketplace");
              }}
              className="mt-5 btn-magnetic bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0"
            >
              Explore Marketplace
            </Button>
          </div>
        ) : (
          <>
            {/* items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence initial={false}>
                {cart.map((item) => (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40, height: 0 }}
                    className="glass rounded-xl p-3 flex gap-3"
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="h-16 w-20 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm leading-tight line-clamp-2">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-muted-foreground hover:text-[var(--neon-pink)] transition-colors shrink-0"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                        <span className="rounded bg-white/5 px-1.5 py-0.5">v{item.version}</span>
                        <span>•</span>
                        <span>{item.type}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-semibold text-gradient">
                          ₹{item.price.toLocaleString("en-IN")}
                        </span>
                        <div className="flex items-center gap-1 glass rounded-lg p-0.5">
                          <button
                            onClick={() => {
                              if (item.quantity > 1)
                                useStore.setState((s) => ({
                                  cart: s.cart.map((c) =>
                                    c.productId === item.productId
                                      ? { ...c, quantity: c.quantity - 1 }
                                      : c
                                  ),
                                }));
                            }}
                            className="grid h-6 w-6 place-items-center rounded hover:bg-white/10"
                            aria-label="Decrease"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              useStore.setState((s) => ({
                                cart: s.cart.map((c) =>
                                  c.productId === item.productId
                                    ? { ...c, quantity: c.quantity + 1 }
                                    : c
                                ),
                              }))
                            }
                            className="grid h-6 w-6 place-items-center rounded hover:bg-white/10"
                            aria-label="Increase"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* coupon */}
              <div className="glass rounded-xl p-3 mt-4">
                <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
                  <Ticket className="h-3.5 w-3.5 text-[var(--neon-amber)]" />
                  Have a coupon code?
                </div>
                {coupon ? (
                  <div className="flex items-center justify-between rounded-lg bg-[var(--neon-emerald)]/10 border border-[var(--neon-emerald)]/30 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-[var(--neon-emerald)]" />
                      <span className="text-sm font-semibold text-[var(--neon-emerald)]">
                        {coupon.code}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        −₹{discount}
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Remove coupon"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="e.g. WELCOME10"
                      className="bg-white/5 border-white/10 h-9 uppercase"
                    />
                    <Button
                      onClick={applyCoupon}
                      disabled={validating || !couponInput.trim()}
                      size="sm"
                      variant="outline"
                      className="glass border-white/15 h-9 px-3"
                    >
                      {validating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground mt-2">
                  Try: WELCOME10 · SHADOW20 · FLAT200 · GAMER500
                </div>
              </div>
            </div>

            {/* summary */}
            <div className="border-t border-white/10 p-4 space-y-2 glass-strong">
              <Row label="Subtotal" value={`₹${subtotal.toLocaleString("en-IN")}`} />
              <Row label="GST (18%)" value={`₹${tax.toLocaleString("en-IN")}`} />
              {discount > 0 && (
                <Row
                  label="Discount"
                  value={`−₹${discount.toLocaleString("en-IN")}`}
                  accent
                />
              )}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-gradient">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
              <Button
                onClick={() => {
                  setCartOpen(false);
                  setCheckoutOpen(true);
                }}
                className="w-full btn-magnetic h-11 mt-2 bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0 glow-violet"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Secure Checkout
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <p className="text-[10px] text-center text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Signed in as {customerEmail}
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "text-[var(--neon-emerald)] font-medium" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}
