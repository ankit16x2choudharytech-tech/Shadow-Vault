"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  Download,
  ShoppingCart,
  Heart,
  ShieldCheck,
  Zap,
  Cpu,
  HardDrive,
  Monitor,
  CheckCircle2,
  ChevronRight,
  ThumbsUp,
  BadgeCheck,
  Send,
  Clock,
  Tag,
} from "lucide-react";
import type { Product, Review } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { useApi } from "@/lib/use-api";
import { invalidateCache } from "@/lib/use-api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const badgeStyles: Record<string, string> = {
  HOT: "bg-[var(--neon-pink)]/20 text-[var(--neon-pink)] border-[var(--neon-pink)]/30",
  NEW: "bg-[var(--neon-emerald)]/20 text-[var(--neon-emerald)] border-[var(--neon-emerald)]/30",
  TRENDING: "bg-[var(--neon-amber)]/20 text-[var(--neon-amber)] border-[var(--neon-amber)]/30",
  DEAL: "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/30",
};

function StarRow({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            size,
            i <= Math.round(rating)
              ? "fill-[var(--neon-amber)] text-[var(--neon-amber)]"
              : "text-white/20"
          )}
        />
      ))}
    </div>
  );
}

export function ProductModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const { addToCart, toggleWishlist, wishlist, setCartOpen } = useStore();
  const [activeShot, setActiveShot] = useState(0);
  const [newReview, setNewReview] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  // fetch fresh reviews via product detail endpoint
  const { data: full } = useApi<Product>(
    product ? `/api/products/${product.slug}` : null
  );
  const reviews = full?.reviews ?? product?.reviews ?? [];

  useEffect(() => {
    setActiveShot(0);
  }, [product?.id]);

  const discount = product?.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const wished = product ? wishlist.includes(product.id) : false;

  const handleAdd = () => {
    if (!product) return;
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
    toast.success(`${product.name} added to cart`);
    onClose();
    setCartOpen(true);
  };

  const handleWish = () => {
    if (!product) return;
    toggleWishlist(product.id);
    toast.success(wished ? "Removed from wishlist" : "Saved to wishlist");
  };

  const submitReview = async () => {
    if (!product) return;
    if (!newReview.trim()) {
      toast.error("Please write a review");
      return;
    }
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          userName: "Guest User",
          rating: reviewRating,
          comment: newReview,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Review submitted — pending verification");
      setNewReview("");
      invalidateCache(`/api/products/${product.slug}`);
      // force reload by toggling — the cache is invalidated; refetch via key bump
    } catch {
      toast.error("Could not submit review");
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 gap-0 glass-strong border-white/10 max-h-[92vh] overflow-hidden">
        <DialogTitle className="sr-only">
          {product?.name ?? "Product details"}
        </DialogTitle>
        <AnimatePresence>
          {product && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-y-auto max-h-[92vh] no-scrollbar"
            >
              {/* Hero banner */}
              <div className="relative h-56 sm:h-72 overflow-hidden">
                <img
                  src={product.banner}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.16_0.02_280/0.98)] via-[oklch(0.16_0.02_280/0.5)] to-transparent" />
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full glass-strong hover:bg-white/20 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {product.badge && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold uppercase border backdrop-blur-md",
                          badgeStyles[product.badge]
                        )}
                      >
                        {product.badge}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium border-white/20 bg-black/40 backdrop-blur-md text-white/80"
                    >
                      {product.type}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-white/70">
                      <ShieldCheck className="h-3.5 w-3.5 text-[var(--neon-emerald)]" />
                      v{product.version}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {product.name}
                  </h2>
                  <p className="text-sm text-white/70 mt-1">{product.tagline}</p>
                </div>
              </div>

              {/* Body */}
              <div className="grid lg:grid-cols-3 gap-6 p-5 sm:p-6">
                {/* Left: gallery + tabs */}
                <div className="lg:col-span-2 space-y-5">
                  {/* main screenshot */}
                  <div className="relative aspect-video rounded-xl overflow-hidden grad-border">
                    <img
                      src={product.screenshots[activeShot] ?? product.thumbnail}
                      alt="Screenshot"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 rounded-md glass px-2 py-0.5 text-[10px] font-medium text-white/80">
                      {activeShot + 1} / {Math.max(product.screenshots.length, 1)}
                    </div>
                  </div>
                  {/* thumbs */}
                  {product.screenshots.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {product.screenshots.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveShot(i)}
                          className={cn(
                            "relative h-16 w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                            activeShot === i
                              ? "border-[var(--neon-violet)]"
                              : "border-transparent opacity-60 hover:opacity-100"
                          )}
                        >
                          <img src={s} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  <Tabs defaultValue="features" className="w-full">
                    <TabsList className="glass bg-white/5 border-white/10 w-full justify-start overflow-x-auto no-scrollbar">
                      <TabsTrigger value="features">Features</TabsTrigger>
                      <TabsTrigger value="whatsnew">What&apos;s New</TabsTrigger>
                      <TabsTrigger value="requirements">Requirements</TabsTrigger>
                      <TabsTrigger value="reviews">
                        Reviews ({reviews.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="features" className="mt-4">
                      <div className="grid sm:grid-cols-2 gap-2.5">
                        {product.features.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2.5 glass rounded-lg p-3"
                          >
                            <CheckCircle2 className="h-4 w-4 text-[var(--neon-emerald)] shrink-0 mt-0.5" />
                            <span className="text-sm text-foreground/90">{f}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                        {product.description}
                      </p>
                    </TabsContent>

                    <TabsContent value="whatsnew" className="mt-4">
                      <div className="space-y-2">
                        {product.whatsNew.length > 0 ? (
                          product.whatsNew.map((w, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2.5 glass rounded-lg p-3"
                            >
                              <Zap className="h-4 w-4 text-[var(--neon-amber)] shrink-0 mt-0.5" />
                              <span className="text-sm text-foreground/90">{w}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No changelog entries yet.
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="requirements" className="mt-4">
                      <div className="grid sm:grid-cols-2 gap-2.5">
                        <ReqRow icon={Monitor} label="Compatibility" value={product.compatibility} />
                        <ReqRow icon={HardDrive} label="File Size" value={product.fileSize} />
                        <ReqRow icon={Cpu} label="Type" value={product.type} />
                        <ReqRow icon={Clock} label="Released" value={new Date(product.releaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
                        {product.requirements.map((r, i) => (
                          <ReqRow key={i} icon={Cpu} label={`Req ${i + 1}`} value={r} />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="reviews" className="mt-4 space-y-4">
                      {/* write review */}
                      <div className="glass rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-medium">Your rating:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <button
                                key={i}
                                onClick={() => setReviewRating(i)}
                                aria-label={`Rate ${i} stars`}
                              >
                                <Star
                                  className={cn(
                                    "h-5 w-5 transition-colors",
                                    i <= reviewRating
                                      ? "fill-[var(--neon-amber)] text-[var(--neon-amber)]"
                                      : "text-white/20 hover:text-white/40"
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <Textarea
                          value={newReview}
                          onChange={(e) => setNewReview(e.target.value)}
                          placeholder="Share your experience with this product…"
                          className="bg-white/5 border-white/10 resize-none"
                          rows={3}
                        />
                        <div className="flex justify-end mt-2">
                          <Button
                            size="sm"
                            onClick={submitReview}
                            className="btn-magnetic bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0"
                          >
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            Submit
                          </Button>
                        </div>
                      </div>

                      {/* reviews list */}
                      {reviews.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No reviews yet. Be the first to review!
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {reviews.map((rv: Review) => (
                            <div key={rv.id} className="glass rounded-xl p-4">
                              <div className="flex items-start gap-3">
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--neon-violet)] to-[var(--neon-pink)] text-white text-sm font-bold">
                                  {rv.userName.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm">{rv.userName}</span>
                                    {rv.verified && (
                                      <Badge variant="outline" className="text-[9px] py-0 h-4 gap-0.5 border-[var(--neon-emerald)]/40 text-[var(--neon-emerald)]">
                                        <BadgeCheck className="h-2.5 w-2.5" />
                                        Verified
                                      </Badge>
                                    )}
                                  </div>
                                  <StarRow rating={rv.rating} size="h-3 w-3" />
                                  <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">
                                    {rv.comment}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                      <ThumbsUp className="h-3 w-3" />
                                      {rv.likes}
                                    </span>
                                    <span>{new Date(rv.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Right: buy box */}
                <div className="lg:col-span-1">
                  <div className="grad-border p-5 sticky top-4 space-y-4">
                    {/* price */}
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gradient">
                          ₹{product.price.toLocaleString("en-IN")}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{product.originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      {discount > 0 && (
                        <div className="inline-flex items-center gap-1 mt-1 rounded-md bg-[var(--neon-emerald)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--neon-emerald)]">
                          <Tag className="h-3 w-3" />
                          Save {discount}% today
                        </div>
                      )}
                    </div>

                    {/* meta */}
                    <div className="space-y-2 text-xs">
                      <MetaRow label="Rating">
                        <StarRow rating={product.rating} size="h-3.5 w-3.5" />
                        <span className="font-medium">{product.rating.toFixed(1)}</span>
                      </MetaRow>
                      <MetaRow label="Sales">
                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                        {product.sales.toLocaleString("en-IN")} downloads
                      </MetaRow>
                      <MetaRow label="Delivery">
                        <Zap className="h-3.5 w-3.5 text-[var(--neon-amber)]" />
                        Instant after payment
                      </MetaRow>
                      <MetaRow label="Security">
                        <ShieldCheck className="h-3.5 w-3.5 text-[var(--neon-emerald)]" />
                        Encrypted file delivery
                      </MetaRow>
                    </div>

                    {/* actions */}
                    <div className="space-y-2 pt-1">
                      <Button
                        onClick={handleAdd}
                        className="w-full btn-magnetic h-11 bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0 glow-violet"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        onClick={handleWish}
                        variant="outline"
                        className="w-full h-10 glass border-white/15 hover:bg-white/10"
                      >
                        <Heart className={cn("h-4 w-4 mr-2", wished && "fill-[var(--neon-pink)] text-[var(--neon-pink)]")} />
                        {wished ? "Wishlisted" : "Add to Wishlist"}
                      </Button>
                    </div>

                    {/* trust */}
                    <div className="pt-3 border-t border-white/10 space-y-2">
                      {[
                        "Razorpay secure payment",
                        "Instant unlock after payment",
                        "Lifetime access in dashboard",
                        "Free version updates",
                      ].map((t) => (
                        <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ChevronRight className="h-3.5 w-3.5 text-[var(--neon-violet)]" />
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function ReqRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="glass rounded-lg p-3 flex items-center gap-3">
      <Icon className="h-4 w-4 text-[var(--neon-violet)] shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 font-medium">{children}</span>
    </div>
  );
}
