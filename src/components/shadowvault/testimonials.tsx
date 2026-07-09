"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Arjun Verma",
    handle: "@ArjunPlays",
    role: "Tournament Player",
    text: "ShadowVault is hands down the cleanest marketplace I've used. Bought the PhantomStrike panel at 2am and had it running before my next match. Zero friction.",
    rating: 5,
    color: "var(--neon-violet)",
  },
  {
    name: "Riya Kapoor",
    handle: "@RiyaGG",
    role: "Streamer · 80k followers",
    text: "The UI is gorgeous and the delivery is genuinely instant. My viewers ask where I get my overlays from — I just drop my ShadowVault referral link.",
    rating: 5,
    color: "var(--neon-pink)",
  },
  {
    name: "Karthik Reddy",
    handle: "@Karthik_GG",
    role: "Esports Coach",
    text: "Refunded a wrong purchase within minutes, no questions asked. The support team actually plays the games they sell tools for. Top tier.",
    rating: 5,
    color: "var(--neon-emerald)",
  },
  {
    name: "Zaid Khan",
    handle: "@ZaidPlays",
    role: "Content Creator",
    text: "Free lifetime updates is the killer feature. Bought Vortex 8 months ago and I've gotten every version since without paying a rupee extra.",
    rating: 5,
    color: "var(--neon-amber)",
  },
  {
    name: "Ananya Singh",
    handle: "@AnanyaPro",
    role: "Competitive Gamer",
    text: "Encrypted delivery through Telegram is genius — I never worry about leaks. The config vault paid for itself in one tournament.",
    rating: 5,
    color: "var(--neon-cyan)",
  },
  {
    name: "Vikram Patel",
    handle: "@VikramClutch",
    role: "Team Captain",
    text: "We bulk-buy for our whole squad. The coupon system + referral earnings make it stupidly affordable. Conversion rate is basically 100%.",
    rating: 5,
    color: "var(--neon-violet)",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground mb-5"
          >
            <Star className="h-3.5 w-3.5 text-[var(--neon-amber)]" />
            Loved by 100+ gamers
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-bold tracking-tight"
          >
            Don&apos;t take our <span className="text-gradient">word for it.</span>
          </motion.h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="grad-border p-6 relative overflow-hidden group"
            >
              <Quote
                className="absolute top-4 right-4 h-10 w-10 opacity-10"
                style={{ color: t.color }}
              />
              <div className="flex items-center gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-4 w-4 fill-[var(--neon-amber)] text-[var(--neon-amber)]"
                  />
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed relative">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/10">
                <div
                  className="grid h-10 w-10 place-items-center rounded-full text-white text-sm font-bold shrink-0"
                  style={{ background: t.color }}
                >
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.handle} · {t.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
