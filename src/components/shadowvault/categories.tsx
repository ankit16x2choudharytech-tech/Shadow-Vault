"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Wrench,
  Settings2,
  Code2,
  Plug,
  Crown,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { useApi } from "@/lib/use-api";
import type { Category } from "@/lib/types";
import { useStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Wrench,
  Settings2,
  Code2,
  Plug,
  Crown,
  CreditCard,
};

const colorMap: Record<string, { bg: string; text: string; glow: string }> = {
  violet: { bg: "rgba(167,139,250,0.12)", text: "var(--neon-violet)", glow: "glow-violet" },
  emerald: { bg: "rgba(52,211,153,0.12)", text: "var(--neon-emerald)", glow: "glow-emerald" },
  amber: { bg: "rgba(251,191,36,0.12)", text: "var(--neon-amber)", glow: "glow-amber" },
  pink: { bg: "rgba(244,114,182,0.12)", text: "var(--neon-pink)", glow: "glow-pink" },
  cyan: { bg: "rgba(34,211,238,0.12)", text: "var(--neon-cyan)", glow: "glow-violet" },
  fuchsia: { bg: "rgba(232,121,249,0.12)", text: "var(--neon-pink)", glow: "glow-pink" },
  rose: { bg: "rgba(251,113,133,0.12)", text: "var(--neon-pink)", glow: "glow-pink" },
};

export function Categories() {
  const { data, loading } = useApi<Category[]>("/api/categories");
  const { setView, setCategory } = useStore();

  const openCategory = (slug: string) => {
    setCategory(slug);
    setView("marketplace");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              Browse by <span className="text-gradient">Category</span>
            </motion.h2>
            <p className="text-muted-foreground mt-2">
              Curated digital products for every kind of gamer.
            </p>
          </div>
          <button
            onClick={() => openCategory("all")}
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />
              ))
            : data?.map((cat, i) => {
                const Icon = iconMap[cat.icon] ?? LayoutDashboard;
                const c = colorMap[cat.color] ?? colorMap.violet;
                return (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -4 }}
                    onClick={() => openCategory(cat.slug)}
                    className="group relative grad-border p-5 text-left overflow-hidden"
                  >
                    <div
                      className="absolute -top-6 -right-6 h-20 w-20 rounded-full blur-2xl opacity-30 group-hover:opacity-60 transition-opacity"
                      style={{ background: c.text }}
                    />
                    <div
                      className="relative grid h-12 w-12 place-items-center rounded-xl mb-4"
                      style={{ background: c.bg }}
                    >
                      <Icon className="h-6 w-6" style={{ color: c.text }} />
                    </div>
                    <h3 className="font-semibold relative">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 relative">
                      {cat.description}
                    </p>
                    <ArrowRight
                      className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                      style={{ color: c.text }}
                    />
                  </motion.button>
                );
              })}
        </div>
      </div>
    </section>
  );
}
