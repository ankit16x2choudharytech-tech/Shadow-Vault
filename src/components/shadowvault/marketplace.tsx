"use client";

import { useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/use-api";
import type { Product, Category } from "@/lib/types";
import { useStore } from "@/lib/store";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { ProductModal } from "./product-modal";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, PackageX } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Marketplace() {
  const { query, setQuery, category, setCategory, sort, setSort } = useStore();
  const [localQuery, setLocalQuery] = useState(query);
  const [selected, setSelected] = useState<Product | null>(null);

  // debounce query
  useEffect(() => {
    const t = setTimeout(() => setQuery(localQuery), 280);
    return () => clearTimeout(t);
  }, [localQuery, setQuery]);

  const { data: categories } = useApi<Category[]>("/api/categories");

  const apiQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (category && category !== "all") p.set("category", category);
    if (sort) p.set("sort", sort);
    return `/api/products?${p.toString()}`;
  }, [query, category, sort]);

  const { data, loading } = useApi<Product[]>(apiQuery);

  return (
    <section className="relative pt-28 pb-20 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            The <span className="text-gradient">Marketplace</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            {data?.length ?? 0} premium products • instant delivery • secure
            checkout
          </p>
        </motion.div>

        {/* filters bar */}
        <div className="glass rounded-2xl p-3 mb-8 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center sticky top-20 z-30">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search products, tools, configs…"
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>

          {/* category pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0 mr-1 hidden sm:block" />
            <CategoryPill
              active={category === "all"}
              onClick={() => setCategory("all")}
              label="All"
            />
            {categories?.map((c) => (
              <CategoryPill
                key={c.id}
                active={category === c.slug}
                onClick={() => setCategory(c.slug)}
                label={c.name}
              />
            ))}
          </div>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full lg:w-44 bg-white/5 border-white/10 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-strong border-white/10">
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="price-low">Price: Low → High</SelectItem>
              <SelectItem value="price-high">Price: High → Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {data.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onOpen={setSelected} />
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl glass mb-4">
              <PackageX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No products found</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Try a different search term or clear your filters.
            </p>
            <Button
              variant="outline"
              className="mt-5 glass border-white/15"
              onClick={() => {
                setLocalQuery("");
                setCategory("all");
                setSort("popular");
              }}
            >
              Reset filters
            </Button>
          </div>
        )}
      </div>

      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

function CategoryPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
        active
          ? "bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white"
          : "glass text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
