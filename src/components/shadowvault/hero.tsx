"use client";

import { motion, useInView, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Zap,
  ShieldCheck,
  Download,
  Lock,
  TrendingUp,
  Users,
  Star,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

function AnimatedNumber({
  to,
  suffix = "",
  decimals = 0,
}: {
  to: number;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref}>
      {val.toLocaleString("en-IN", {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

const stats = [
  { icon: Users, label: "Active Members", value: 100, suffix: "+", color: "var(--neon-violet)" },
  { icon: Download, label: "Files Delivered", value: 200, suffix: "+", color: "var(--neon-emerald)" },
  { icon: Star, label: "Avg. Rating", value: 4.9, decimals: 1, color: "var(--neon-amber)" },
  { icon: ShieldCheck, label: "Secure Orders", value: 99.8, decimals: 1, suffix: "%", color: "var(--neon-pink)" },
];

const pills = [
  { icon: Zap, text: "Instant Unlock" },
  { icon: Lock, text: "Encrypted Delivery" },
  { icon: ShieldCheck, text: "Verified Reviews" },
  { icon: TrendingUp, text: "Always Updated" },
];

export function Hero() {
  const { setView } = useStore();

  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--neon-emerald)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--neon-emerald)]" />
            </span>
            India&apos;s #1 premium digital delivery platform
            <Sparkles className="h-3.5 w-3.5 text-[var(--neon-amber)]" />
          </motion.div>

          {/* headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08 }}
            className="font-bold tracking-tight text-4xl sm:text-6xl lg:text-7xl max-w-4xl leading-[1.05]"
          >
            Premium Game Panels
            <br />
            <span className="text-gradient">Delivered Instantly.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16 }}
            className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed"
          >
            Buy game panels, mods, configs & premium files with Razorpay.
            Pay once — unlock instantly. Files delivered securely through
            encrypted channels. Zero manual work.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24 }}
            className="mt-9 flex flex-col sm:flex-row items-center gap-3"
          >
            <Button
              onClick={() => setView("marketplace")}
              size="lg"
              className="btn-magnetic group bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0 px-8 h-12 text-base glow-violet"
            >
              Explore Marketplace
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              variant="outline"
              size="lg"
              className="btn-magnetic glass border-white/15 px-8 h-12 text-base hover:bg-white/10"
            >
              Why ShadowVault?
            </Button>
          </motion.div>

          {/* pills */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-2.5"
          >
            {pills.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.text}
                  className="inline-flex items-center gap-1.5 rounded-full glass px-3.5 py-1.5 text-xs font-medium"
                >
                  <Icon className="h-3.5 w-3.5 text-[var(--neon-emerald)]" />
                  {p.text}
                </div>
              );
            })}
          </motion.div>

          {/* stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl"
          >
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="grad-border p-5 text-center relative overflow-hidden group"
                >
                  <div
                    className="absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"
                    style={{ background: s.color }}
                  />
                  <Icon
                    className="h-6 w-6 mx-auto mb-2 relative"
                    style={{ color: s.color }}
                  />
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight relative">
                    <AnimatedNumber
                      to={s.value}
                      suffix={s.suffix}
                      decimals={s.decimals ?? 0}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 relative">
                    {s.label}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function Ticker() {
  const items = [
    // "PHANTOMSTRIKE PRO v4.2 — UPDATED",
    // "NEXUS MOD MENU — TRENDING #1",
    "NEW: CIPHER STREAMER KIT",
    "FLAT ₹500 OFF ON ORDERS ₹2999+",
    "VORTEX EMULATOR SUITE — NEW RELEASE",
    "APEX CONFIG PACK — DEAL OF THE WEEK",
    "24/7 ENCRYPTED DELIVERY",
    "ZERO MANUAL WAIT TIME",
  ];
  const doubled = [...items, ...items];
  return (
    <div className="relative border-y border-white/10 bg-black/30 backdrop-blur-sm overflow-hidden py-3">
      <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
        {doubled.map((t, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <Zap className="h-3.5 w-3.5 text-[var(--neon-amber)]" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
