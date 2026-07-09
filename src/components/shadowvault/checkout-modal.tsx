"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  CreditCard,
  Loader2,
  CheckCircle2,
  Lock,
  Zap,
  Download,
  ArrowRight,
  Wallet,
  Smartphone,
} from "lucide-react";
import { useStore, cartSubtotal } from "@/lib/store";
import { invalidateCache } from "@/lib/use-api";
import { toast } from "sonner";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

type Stage = "form" | "processing" | "success" | "failed";

export function CheckoutModal() {
  const {
    checkoutOpen,
    setCheckoutOpen,
    cart,
    coupon,
    discount,
    clearCart,
    customerEmail,
    setCustomerEmail,
  } = useStore();

  const [stage, setStage] = useState<Stage>("form");
  const [name, setName] = useState("Demo Gamer");
  const [email, setEmail] = useState(customerEmail);
  const [phone, setPhone] = useState("9876543210");
  const [method, setMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const subtotal = cartSubtotal(cart);
  const tax = Math.round(subtotal * 0.18);
  const total = Math.max(0, subtotal + tax - discount);

  const close = () => {
    setCheckoutOpen(false);
    setTimeout(() => setStage("form"), 300);
  };

  const startPayment = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please fill all fields");
      return;
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setStage("processing");
    setCustomerEmail(email.trim());

    try {
      // The orderData we'll send to verify (creates the real order in DB).
      const orderData = {
        customerName: name.trim(),
        customerEmail: email.trim(),
        items: cart.map((c) => ({ productId: c.productId })),
        couponCode: coupon?.code ?? null,
        total,
      };

      // Step 1: Try to create a real Razorpay order on the server.
      let rzpOrderId: string | null = null;
      let rzpAmount: number | null = null;
      let rzpKeyId: string | null = null;
      let realRazorpay = false;
      try {
        const createRes = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            currency: "INR",
            receipt: `sv_${Date.now()}`,
            notes: {
              customerName: name.trim(),
              customerEmail: email.trim(),
              phone: phone.trim(),
              items: String(cart.length),
            },
          }),
        });
        if (createRes.ok) {
          const createJson = await createRes.json();
          rzpOrderId = createJson.orderId;
          rzpAmount = createJson.amount;
          rzpKeyId = createJson.keyId;
          realRazorpay = !!(rzpOrderId && rzpKeyId);
        }
      } catch {
        // create-order failed — fall through to demo mode below
      }

      if (realRazorpay && rzpKeyId) {
        // Step 2 (real): load Razorpay checkout.js and open the modal.
        await new Promise<void>((resolve, reject) => {
          if ((window as any).Razorpay) return resolve();
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.body.appendChild(script);
        });

        const rzp = new (window as any).Razorpay({
          key: rzpKeyId,
          amount: rzpAmount,
          currency: "INR",
          name: "ShadowVault",
          description: `Purchase · ${cart.length} item(s)`,
          order_id: rzpOrderId,
          prefill: {
            name: name.trim(),
            email: email.trim(),
            contact: phone.trim(),
          },
          theme: { color: "#a855f7" },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch("/api/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderData,
                }),
              });
              const verifyJson = await verifyRes.json();
              if (!verifyRes.ok || !verifyJson.success) {
                setStage("failed");
                toast.error("Payment verification failed");
                return;
              }
              setCreatedOrder(verifyJson.order);
              setStage("success");
              invalidateCache(
                `/api/orders?email=${encodeURIComponent(email.trim())}`
              );
              invalidateCache("/api/orders");
              toast.success("Payment successful! Products unlocked.");
            } catch {
              setStage("failed");
              toast.error("Payment verification failed");
            }
          },
          modal: {
            ondismiss: () => {
              setStage("form");
              toast.error("Payment cancelled");
            },
          },
        });
        rzp.open();
        return;
      }

      // Step 2 (demo fallback): simulate the payment + verification.
      // The verify route auto-passes when signature === "demo".
      await new Promise((r) => setTimeout(r, 1400));
      const verifyRes = await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: rzpOrderId || `order_demo_${Date.now()}`,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_signature: "demo",
          orderData,
        }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok || !verifyJson.success) {
        throw new Error(verifyJson.error || "Verification failed");
      }
      setCreatedOrder(verifyJson.order);
      setStage("success");
      invalidateCache(
        `/api/orders?email=${encodeURIComponent(email.trim())}`
      );
      invalidateCache("/api/orders");
      toast.success("Payment successful! Products unlocked.");
    } catch (err) {
      setStage("failed");
      toast.error("Payment failed", {
        description: (err as Error).message,
      });
    }
  };

  const reset = () => {
    setStage("form");
    setCreatedOrder(null);
  };

  return (
    <Dialog
      open={checkoutOpen}
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <DialogContent className="max-w-md w-[95vw] p-0 gap-0 glass-strong border-white/10 overflow-hidden">
        <DialogTitle className="sr-only">Checkout</DialogTitle>

        {/* Razorpay-style header */}
        <div className="relative bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/20 backdrop-blur">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">ShadowVault Pay</div>
                <div className="text-[10px] text-white/80">Powered by Razorpay</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-white/70 uppercase tracking-wide">Amount</div>
              <div className="text-lg font-bold text-white">
                ₹{total.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* FORM STAGE */}
          {stage === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-5 space-y-4"
            >
              <div className="space-y-3">
                <Field label="Full Name">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-white/10"
                    placeholder="Your name"
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-white/10"
                    placeholder="you@email.com"
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-white/5 border-white/10"
                    placeholder="10-digit mobile"
                  />
                </Field>
              </div>

              {/* payment methods */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Payment Method
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <MethodBtn
                    active={method === "upi"}
                    onClick={() => setMethod("upi")}
                    icon={Smartphone}
                    label="UPI"
                  />
                  <MethodBtn
                    active={method === "card"}
                    onClick={() => setMethod("card")}
                    icon={CreditCard}
                    label="Card"
                  />
                  <MethodBtn
                    active={method === "netbanking"}
                    onClick={() => setMethod("netbanking")}
                    icon={Wallet}
                    label="Net Banking"
                  />
                </div>
                <div className="mt-2 rounded-lg glass p-2.5 text-[11px] text-muted-foreground flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-[var(--neon-emerald)]" />
                  {method === "upi" && "Pay via GPay, PhonePe, Paytm or any UPI app"}
                  {method === "card" && "Visa, Mastercard, RuPay accepted — 256-bit encrypted"}
                  {method === "netbanking" && "All major Indian banks supported"}
                </div>
              </div>

              {/* summary */}
              <div className="rounded-lg glass p-3 space-y-1.5 text-sm">
                <SummaryRow label={`Items (${cart.length})`} value={`₹${subtotal.toLocaleString("en-IN")}`} />
                <SummaryRow label="GST (18%)" value={`₹${tax.toLocaleString("en-IN")}`} />
                {discount > 0 && (
                  <SummaryRow
                    label={`Coupon ${coupon?.code}`}
                    value={`−₹${discount.toLocaleString("en-IN")}`}
                    accent
                  />
                )}
                <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                  <span className="font-semibold">Total Payable</span>
                  <span className="font-bold text-gradient">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <Button
                onClick={startPayment}
                disabled={cart.length === 0}
                className="w-full btn-magnetic h-12 bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0 glow-violet"
              >
                <Lock className="h-4 w-4 mr-2" />
                Pay ₹{total.toLocaleString("en-IN")} Securely
              </Button>
              <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                PCI-DSS compliant · Signature verified · Zero card storage
              </p>
            </motion.div>
          )}

          {/* PROCESSING STAGE */}
          {stage === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-10 flex flex-col items-center text-center"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-[var(--neon-violet)] blur-2xl opacity-50 animate-pulse" />
                <Loader2 className="relative h-14 w-14 animate-spin text-[var(--neon-violet)]" />
              </div>
              <h3 className="font-semibold text-lg">Processing Payment</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Verifying signature with Razorpay… please don&apos;t close this
                window.
              </p>
              <div className="mt-5 space-y-2 w-full max-w-xs text-left">
                <Step label="Creating order" done />
                <Step label="Awaiting payment" done />
                <Step label="Verifying signature" active />
                <Step label="Unlocking products" />
              </div>
            </motion.div>
          )}

          {/* SUCCESS STAGE */}
          {stage === "success" && createdOrder && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 16 }}
                className="relative mb-5"
              >
                <div className="absolute inset-0 bg-[var(--neon-emerald)] blur-2xl opacity-50" />
                <div className="relative grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[var(--neon-emerald)] to-[var(--neon-cyan)] glow-emerald">
                  <CheckCircle2 className="h-9 w-9 text-white" strokeWidth={2.5} />
                </div>
              </motion.div>
              <h3 className="font-bold text-xl text-[var(--neon-emerald)]">
                Payment Successful!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your products are unlocked and ready to download.
              </p>

              <div className="mt-5 w-full glass rounded-xl p-4 space-y-2 text-left text-sm">
                <SummaryRow label="Order ID" value={createdOrder.orderNumber} />
                <SummaryRow label="Payment ID" value={createdOrder.paymentId ?? "—"} />
                <SummaryRow label="Amount Paid" value={`₹${createdOrder.total.toLocaleString("en-IN")}`} />
                <SummaryRow label="Status" value="PAID" accent />
              </div>

              <Button
                onClick={() => {
                  clearCart();
                  close();
                  useStore.getState().setView("dashboard");
                }}
                className="w-full btn-magnetic h-11 mt-5 bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0"
              >
                <Download className="h-4 w-4 mr-2" />
                Go to Downloads
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <button
                onClick={close}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </motion.div>
          )}

          {/* FAILED STAGE */}
          {stage === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 flex flex-col items-center text-center"
            >
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--neon-pink)]/20 mb-4">
                <Zap className="h-8 w-8 text-[var(--neon-pink)]" />
              </div>
              <h3 className="font-bold text-lg">Payment Failed</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                The transaction could not be completed. No money was deducted.
              </p>
              <div className="flex gap-2 mt-5 w-full">
                <Button
                  onClick={reset}
                  className="flex-1 btn-magnetic bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0"
                >
                  Try Again
                </Button>
                <Button
                  onClick={close}
                  variant="outline"
                  className="flex-1 glass border-white/15"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function MethodBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-lg p-2.5 border transition-all",
        active
          ? "border-[var(--neon-violet)] bg-[var(--neon-violet)]/10"
          : "border-white/10 glass hover:bg-white/5"
      )}
    >
      <Icon
        className={cn("h-4 w-4", active ? "text-[var(--neon-violet)]" : "text-muted-foreground")}
      />
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", accent && "text-[var(--neon-emerald)]")}>
        {value}
      </span>
    </div>
  );
}

function Step({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      {done ? (
        <CheckCircle2 className="h-4 w-4 text-[var(--neon-emerald)]" />
      ) : active ? (
        <Loader2 className="h-4 w-4 animate-spin text-[var(--neon-violet)]" />
      ) : (
        <div className="h-4 w-4 rounded-full border-2 border-white/20" />
      )}
      <span className={done || active ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}
