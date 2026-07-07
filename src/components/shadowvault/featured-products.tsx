"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Sparkles, TrendingUp, RefreshCw } from "lucide-react";
import { useApi } from "@/lib/use-api";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";
import { ProductModal } from "./product-modal";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

type Section = "trending" | "new" | "top" | "updated";

const tabs: { id: Section; label: string; icon: React.ComponentType<{ className?: string }>; sort: string; sortFallback?: string }[] = [
  { id: "trending", label: "Trending Now", icon: TrendingUp, sort: "popular" },
  { id: "new", label: "New Releases", icon: Sparkles, sort: "newest" },
  { id: "top", label: "Top Selling", icon: Flame, sort: "popular" },
  { id: "updated", label: "Recently Updated", icon: RefreshCw, sort: "newest" },
];

export function FeaturedProducts() {
  const [active, setActive] = useState<Section>("trending");
  const [selected, setSelected] = useState<Product | null>(null);
  const { setView } = useStore();

  // fetch all once; we slice client-side for variety by section
  const { data, loading } = useApi<Product[]>("/api/products?limit=12");

  const sliced = useMemo(() => {
    if (!data) return [];
    const map: Record<Section, Product[]> = {
      trending: [...data].sort((a, b) => b.sales - a.sales).slice(0, 4),
      new: [...data].sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate)).slice(0, 4),
      top: [...data].sort((a, b) => b.rating - a.rating).slice(0, 4),
      updated: [...data].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 4),
    };
    return map[active];
  }, [data, active]);

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              Featured <span className="text-gradient">Products</span>
            </motion.h2>
            <p className="text-muted-foreground mt-2">
              Hand-picked premium files, updated daily.
            </p>
          </div>
          <Button
            onClick={() => setView("marketplace")}
            variant="outline"
            className="glass border-white/15 self-start sm:self-auto"
          >
            View all products
          </Button>
        </div>

        {/* tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`relative shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "text-white"
                    : "glass text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="feat-active"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="h-4 w-4 relative z-10" />
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grad-border overflow-hidden">
                  <div className="aspect-[16/10] shimmer bg-white/5" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-white/5" />
                    <div className="h-3 w-1/2 rounded bg-white/5" />
                  </div>
                </div>
              ))
            : sliced.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} onOpen={setSelected} />
              ))}
        </div>
      </div>

      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
