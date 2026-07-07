"use client";

import { motion } from "framer-motion";
import {
  Zap,
  ShieldCheck,
  Download,
  RefreshCw,
  Headphones,
  Lock,
  BadgePercent,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Unlock",
    desc: "The moment your payment is verified, your product unlocks — no waiting, no manual approval.",
    color: "var(--neon-amber)",
  },
  {
    icon: ShieldCheck,
    title: "Razorpay Secure",
    desc: "Every transaction is protected by Razorpay's PCI-DSS compliant gateway with signature verification.",
    color: "var(--neon-emerald)",
  },
  {
    icon: Lock,
    title: "Encrypted Delivery",
    desc: "Files are stored in a private Telegram channel. We only ever serve encrypted tokens — never direct links.",
    color: "var(--neon-violet)",
  },
  {
    icon: RefreshCw,
    title: "Free Lifetime Updates",
    desc: "Buy once and get every future version of your product delivered to your dashboard automatically.",
    color: "var(--neon-cyan)",
  },
  {
    icon: BadgePercent,
    title: "Smart Coupons",
    desc: "Stack flash deals, referral discounts and seasonal coupons to save big on every purchase.",
    color: "var(--neon-pink)",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    desc: "A real human team ready to help with downloads, license issues and refunds — any time, any day.",
    color: "var(--neon-amber)",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground mb-5"
          >
            <Star className="h-3.5 w-3.5 text-[var(--neon-amber)]" />
            Why gamers choose ShadowVault
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-bold tracking-tight"
          >
            Built for <span className="text-gradient">serious gamers.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-4"
          >
            Premium infrastructure, obsessive security, and an experience that
            feels instant from click to download.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -6 }}
                className="group grad-border p-6 relative overflow-hidden"
              >
                <div
                  className="absolute -top-10 -right-10 h-28 w-28 rounded-full blur-3xl opacity-25 group-hover:opacity-50 transition-opacity"
                  style={{ background: f.color }}
                />
                <div
                  className="relative grid h-12 w-12 place-items-center rounded-xl mb-4"
                  style={{ background: `${f.color}22` }}
                >
                  <Icon className="h-6 w-6" style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold text-lg relative">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed relative">
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* delivery flow */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grad-border p-6 sm:p-10"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold">
              From click to download in <span className="text-gradient">under 30 seconds</span>
            </h3>
          </div>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { n: "01", t: "Click Buy", d: "Add to cart & checkout", c: "var(--neon-violet)" },
              { n: "02", t: "Pay via Razorpay", d: "UPI, card or netbanking", c: "var(--neon-pink)" },
              { n: "03", t: "Signature Verified", d: "Automatic & encrypted", c: "var(--neon-amber)" },
              { n: "04", t: "Instant Download", d: "Unlocked in dashboard", c: "var(--neon-emerald)" },
            ].map((s, i) => (
              <div key={s.n} className="relative text-center">
                <div
                  className="text-4xl font-bold mb-2"
                  style={{ color: s.c }}
                >
                  {s.n}
                </div>
                <div className="font-semibold">{s.t}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.d}</div>
                {i < 3 && (
                  <div className="hidden sm:block absolute top-6 -right-2 text-white/20">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
