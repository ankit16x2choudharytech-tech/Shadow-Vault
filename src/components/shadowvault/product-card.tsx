"use client";

import { motion } from "framer-motion";
import {
  Star,
  Download,
  Heart,
  ShoppingCart,
  Eye,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { Product } from "@/lib/types";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const badgeStyles: Record<string, string> = {
  HOT: "bg-[var(--neon-pink)]/20 text-[var(--neon-pink)] border-[var(--neon-pink)]/30",
  NEW: "bg-[var(--neon-emerald)]/20 text-[var(--neon-emerald)] border-[var(--neon-emerald)]/30",
  TRENDING: "bg-[var(--neon-amber)]/20 text-[var(--neon-amber)] border-[var(--neon-amber)]/30",
  DEAL: "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/30",
};

export function ProductCard({
  product,
  index = 0,
  onOpen,
}: {
  product: Product;
  index?: number;
  onOpen: (p: Product) => void;
}) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const wished = wishlist.includes(product.id);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      thumbnail: product.thumbnail,
      version: product.version,
      type: product.type,
      quantity: 1,
    });
    toast.success(`${product.name} added to cart`, {
      description: "Proceed to checkout when ready.",
    });
  };

  const handleWish = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
    toast.success(wished ? "Removed from wishlist" : "Saved to wishlist");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06 }}
      whileHover={{ y: -6 }}
      onClick={() => onOpen(product)}
      className="group relative grad-border cursor-pointer overflow-hidden tilt-card"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-[var(--radius-lg)]">
        <img
          src={product.thumbnail}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.badge && (
            <Badge
              variant="outline"
              className={`text-[10px] font-bold uppercase tracking-wide border backdrop-blur-md ${badgeStyles[product.badge]}`}
            >
              {product.badge}
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="text-[10px] font-bold bg-[var(--neon-emerald)] text-black border-0">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* wishlist */}
        <button
          onClick={handleWish}
          aria-label="Toggle wishlist"
          className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full glass-strong hover:bg-white/20 transition-colors"
        >
          <Heart
            className={`h-4 w-4 transition-all ${
              wished
                ? "fill-[var(--neon-pink)] text-[var(--neon-pink)]"
                : "text-white"
            }`}
          />
        </button>

        {/* hover quick view */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-white/90">
            <Eye className="h-3.5 w-3.5" />
            Quick view
          </div>
        </div>

        {/* version chip */}
        <div className="absolute bottom-3 left-3 group-hover:opacity-0 transition-opacity">
          <span className="inline-flex items-center gap-1 rounded-md glass px-2 py-0.5 text-[10px] font-medium text-white/90">
            <ShieldCheck className="h-3 w-3 text-[var(--neon-emerald)]" />
            v{product.version}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold leading-tight line-clamp-1 group-hover:text-[var(--neon-violet)] transition-colors">
            {product.name}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
          {product.tagline}
        </p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-[var(--neon-amber)] text-[var(--neon-amber)]" />
            <span className="font-medium text-foreground">{product.rating.toFixed(1)}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            {product.sales.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[11px] text-muted-foreground line-through">
                ₹{product.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
            <span className="text-lg font-bold text-gradient">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
          </div>
          <button
            onClick={handleAdd}
            aria-label={`Add ${product.name} to cart`}
            className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-[var(--neon-violet)] to-[var(--neon-pink)] text-white btn-magnetic hover:opacity-90"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* shine */}
      <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute -inset-px rounded-[var(--radius-lg)] bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
      </div>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="grad-border overflow-hidden">
      <div className="aspect-[16/10] shimmer bg-white/5" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 rounded bg-white/5" />
        <div className="h-3 w-1/2 rounded bg-white/5" />
        <div className="flex justify-between pt-2">
          <div className="h-5 w-16 rounded bg-white/5" />
          <div className="h-8 w-8 rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
}
