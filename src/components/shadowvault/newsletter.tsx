"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, Gift, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
    toast.success("You're in! Check your inbox for a 10% welcome coupon.");
  };

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grad-border p-8 sm:p-12 relative overflow-hidden text-center"
        >
          {/* glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-80 rounded-full bg-[var(--neon-violet)] blur-3xl opacity-30" />
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 h-40 w-80 rounded-full bg-[var(--neon-pink)] blur-3xl opacity-20" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground mb-5">
              <Gift className="h-3.5 w-3.5 text-[var(--neon-amber)]" />
              Get 10% off your first order
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-2xl mx-auto">
              Drop your email. <span className="text-gradient">Get the drop.</span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              New product drops, flash sales and exclusive coupons — straight to
              your inbox. No spam, ever.
            </p>

            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 inline-flex items-center gap-2 rounded-xl glass px-6 py-4 text-sm"
              >
                <CheckCircle2 className="h-5 w-5 text-[var(--neon-emerald)]" />
                <span>You&apos;re subscribed! Welcome coupon on its way.</span>
              </motion.div>
            ) : (
              <form
                onSubmit={subscribe}
                className="mt-8 flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
              >
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="pl-9 bg-white/5 border-white/10 h-11"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="btn-magnetic h-11 bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0 glow-violet"
                >
                  Subscribe
                  <Send className="h-4 w-4 ml-2" />
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
