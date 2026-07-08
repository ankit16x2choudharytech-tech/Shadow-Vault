"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Package, Ticket, X, Upload, FileCheck2, FileUp, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useApi, invalidateCache } from "@/lib/use-api";
import type { Category, Coupon, Product } from "@/lib/types";

/* ====================== ADD PRODUCT MODAL ====================== */

export function AddProductModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: () => void;
}) {
  const { data: categories } = useApi<Category[]>("/api/categories");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    type: "Panel",
    compatibility: "Windows 10/11",
    fileSize: "",
    version: "1.0.0",
    thumbnail: "",
    features: "",
  });

  const reset = () => {
    setForm({
      name: "",
      tagline: "",
      description: "",
      price: "",
      originalPrice: "",
      category: "",
      type: "Panel",
      compatibility: "Windows 10/11",
      fileSize: "",
      version: "1.0.0",
      thumbnail: "",
      features: "",
    });
    setFileUrl(null);
    setFileName("");
  };

  // upload the selected file to /api/upload and store the returned URL
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setFileUrl(json.url);
      setFileName(file.name);
      // auto-fill file size if empty (human readable)
      if (!form.fileSize) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setForm((f) => ({
          ...f,
          fileSize: file.size >= 1024 * 1024 ? `${sizeMB} MB` : `${Math.round(file.size / 1024)} KB`,
        }));
      }
      toast.success("File uploaded", {
        description: `${file.name} is ready for delivery.`,
      });
    } catch (err) {
      toast.error("Upload failed", {
        description: (err as Error).message,
      });
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.tagline || !form.description || !form.price) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!fileUrl) {
      toast.error("Please upload the product file", {
        description: "Customers need a file to download after purchase.",
      });
      return;
    }
    setLoading(true);
    try {
      const features = form.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          tagline: form.tagline,
          description: form.description,
          price: Number(form.price),
          originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
          category: form.category || undefined,
          type: form.type,
          compatibility: form.compatibility,
          fileSize: form.fileSize || undefined,
          version: form.version,
          thumbnail: form.thumbnail || undefined,
          telegramFileId: fileUrl, // the uploaded file's URL — used for delivery
          features,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast.success("Product created successfully!", {
        description: `${form.name} is now live in the marketplace.`,
      });
      invalidateCache("/api/products");
      invalidateCache("/api/products?limit=12");
      onCreated?.();
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to create product", {
        description: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] p-0 gap-0 glass-strong border-white/10 max-h-[92vh] overflow-hidden">
        <DialogTitle className="sr-only">Add new product</DialogTitle>
        <div className="overflow-y-auto max-h-[92vh] no-scrollbar">
          {/* header */}
          <div className="relative bg-gradient-to-br from-[var(--neon-violet)]/30 to-[var(--neon-pink)]/20 p-5 flex items-center gap-3 sticky top-0 z-10 glass-strong border-b border-white/10">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--neon-violet)]/20">
              <Package className="h-5 w-5 text-[var(--neon-violet)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">Add New Product</h2>
              <p className="text-[11px] text-muted-foreground">
                Create a new digital product for the marketplace
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="grid h-8 w-8 place-items-center rounded-lg glass hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={submit} className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Product Name *">
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. PhantomStrike Pro"
                  className="bg-white/5 border-white/10"
                  required
                />
              </Field>
              <Field label="Version">
                <Input
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  placeholder="1.0.0"
                  className="bg-white/5 border-white/10"
                />
              </Field>
            </div>

            <Field label="Tagline *">
              <Input
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="One-line punchy description"
                className="bg-white/5 border-white/10"
                required
              />
            </Field>

            <Field label="Description *">
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detailed product description..."
                className="bg-white/5 border-white/10 resize-none"
                rows={3}
                required
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Price (₹) *">
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="499"
                  className="bg-white/5 border-white/10"
                  required
                />
              </Field>
              <Field label="Original Price (₹)">
                <Input
                  type="number"
                  value={form.originalPrice}
                  onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                  placeholder="999"
                  className="bg-white/5 border-white/10"
                />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Category">
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-white/10">
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.slug}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Type">
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-white/10">
                    <SelectItem value="Panel">Panel</SelectItem>
                    <SelectItem value="Mod Menu">Mod Menu</SelectItem>
                    <SelectItem value="Emulator Tool">Emulator Tool</SelectItem>
                    <SelectItem value="Config">Config</SelectItem>
                    <SelectItem value="Premium File">Premium File</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Compatibility">
                <Input
                  value={form.compatibility}
                  onChange={(e) => setForm({ ...form, compatibility: e.target.value })}
                  placeholder="Windows 10/11, Android 12+"
                  className="bg-white/5 border-white/10"
                />
              </Field>
              <Field label="File Size">
                <Input
                  value={form.fileSize}
                  onChange={(e) => setForm({ ...form, fileSize: e.target.value })}
                  placeholder="24.5 MB"
                  className="bg-white/5 border-white/10"
                />
              </Field>
            </div>

            <Field label="Thumbnail URL">
              <Input
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="bg-white/5 border-white/10"
              />
            </Field>

            <Field label="Features (one per line)">
              <Textarea
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                placeholder={"Undetectable ESP\nAimbot with smooth targeting\nCustom configs"}
                className="bg-white/5 border-white/10 resize-none"
                rows={3}
              />
            </Field>

            {/* File upload — the actual downloadable file */}
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5 text-xs font-medium text-muted-foreground">
                <FileUp className="h-3.5 w-3.5" />
                Product File * <span className="text-[var(--neon-pink)]">(required — customers download this)</span>
              </Label>
              {fileUrl ? (
                <div className="rounded-lg border border-[var(--neon-emerald)]/40 bg-[var(--neon-emerald)]/10 p-3 flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--neon-emerald)]/20">
                    <FileCheck2 className="h-5 w-5 text-[var(--neon-emerald)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{fileName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Uploaded · ready for delivery
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFileUrl(null);
                      setFileName("");
                    }}
                    className="grid h-7 w-7 place-items-center rounded-lg glass hover:bg-white/10 text-muted-foreground hover:text-[var(--neon-pink)]"
                    aria-label="Remove file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="group flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/15 hover:border-[var(--neon-violet)]/50 hover:bg-white/5 transition-colors p-6 cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <>
                      <Loader2 className="h-7 w-7 animate-spin text-[var(--neon-violet)]" />
                      <span className="text-sm text-muted-foreground">Uploading…</span>
                    </>
                  ) : (
                    <>
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--neon-violet)]/10 group-hover:bg-[var(--neon-violet)]/20 transition-colors">
                        <Upload className="h-5 w-5 text-[var(--neon-violet)]" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-medium">Click to upload</span>
                        <span className="block text-[11px] text-muted-foreground mt-0.5">
                          .zip · .rar · .exe · .apk · .json · max 50 MB
                        </span>
                      </div>
                    </>
                  )}
                </label>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={loading || uploading}
                className="flex-1 btn-magnetic h-11 bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0 glow-violet"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {loading ? "Creating…" : "Create Product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="glass border-white/15"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ====================== ADD COUPON MODAL ====================== */

export function AddCouponModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: (c: Coupon) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "PERCENT",
    value: "",
    minAmount: "",
    maxDiscount: "",
    usageLimit: "100",
    expiry: "",
  });

  const reset = () =>
    setForm({
      code: "",
      type: "PERCENT",
      value: "",
      minAmount: "",
      maxDiscount: "",
      usageLimit: "100",
      expiry: "",
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.value) {
      toast.error("Please fill code and value");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          type: form.type,
          value: Number(form.value),
          minAmount: form.minAmount ? Number(form.minAmount) : 0,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
          usageLimit: Number(form.usageLimit) || 100,
          expiry: form.expiry || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast.success("Coupon created!", {
        description: `${form.code.toUpperCase()} is now active.`,
      });
      invalidateCache("/api/coupons");
      onCreated?.(json.data);
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to create coupon", {
        description: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] p-0 gap-0 glass-strong border-white/10 overflow-hidden">
        <DialogTitle className="sr-only">Create new coupon</DialogTitle>
        {/* header */}
        <div className="relative bg-gradient-to-br from-[var(--neon-amber)]/30 to-[var(--neon-pink)]/20 p-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--neon-amber)]/20">
            <Ticket className="h-5 w-5 text-[var(--neon-amber)]" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">New Coupon</h2>
            <p className="text-[11px] text-muted-foreground">
              Create a discount coupon for customers
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="grid h-8 w-8 place-items-center rounded-lg glass hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <Field label="Coupon Code *">
            <Input
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
              placeholder="SUMMER25"
              className="bg-white/5 border-white/10 uppercase"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type *">
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  <SelectItem value="PERCENT">Percentage</SelectItem>
                  <SelectItem value="FLAT">Flat ₹</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={form.type === "PERCENT" ? "Discount %" : "Discount ₹"}>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === "PERCENT" ? "25" : "200"}
                className="bg-white/5 border-white/10"
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Order (₹)">
              <Input
                type="number"
                value={form.minAmount}
                onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                placeholder="499"
                className="bg-white/5 border-white/10"
              />
            </Field>
            {form.type === "PERCENT" && (
              <Field label="Max Discount (₹)">
                <Input
                  type="number"
                  value={form.maxDiscount}
                  onChange={(e) =>
                    setForm({ ...form, maxDiscount: e.target.value })
                  }
                  placeholder="500"
                  className="bg-white/5 border-white/10"
                />
              </Field>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Usage Limit">
              <Input
                type="number"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                placeholder="100"
                className="bg-white/5 border-white/10"
              />
            </Field>
            <Field label="Expiry Date">
              <Input
                type="date"
                value={form.expiry}
                onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                className="bg-white/5 border-white/10"
              />
            </Field>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 btn-magnetic h-11 bg-gradient-to-r from-[var(--neon-amber)] to-[var(--neon-pink)] text-white border-0 glow-amber"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {loading ? "Creating…" : "Create Coupon"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="glass border-white/15"
            >
              Cancel
            </Button>
          </div>
        </form>
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
      <Label className="block mb-1.5 text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

/* ====================== EDIT PRODUCT MODAL ====================== */

export function EditProductModal({
  product,
  onOpenChange,
  onSaved,
}: {
  product: Product | null;
  onOpenChange: (o: boolean) => void;
  onSaved?: () => void;
}) {
  const { data: categories } = useApi<Category[]>("/api/categories");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    type: "Panel",
    compatibility: "",
    fileSize: "",
    version: "",
    thumbnail: "",
    badge: "",
  });

  // populate form when product changes
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        tagline: product.tagline,
        description: product.description,
        price: String(product.price),
        originalPrice: product.originalPrice ? String(product.originalPrice) : "",
        category: product.category,
        type: product.type,
        compatibility: product.compatibility,
        fileSize: product.fileSize,
        version: product.version,
        thumbnail: product.thumbnail,
        badge: product.badge ?? "",
      });
    }
  }, [product]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!form.name || !form.price) {
      toast.error("Name and price are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          tagline: form.tagline,
          description: form.description,
          price: Number(form.price),
          originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
          category: form.category || undefined,
          type: form.type,
          compatibility: form.compatibility,
          fileSize: form.fileSize,
          version: form.version,
          thumbnail: form.thumbnail,
          badge: form.badge || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast.success("Product updated!", {
        description: `${form.name} has been saved.`,
      });
      invalidateCache("/api/products");
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error("Update failed", {
        description: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] p-0 gap-0 glass-strong border-white/10 max-h-[92vh] overflow-hidden">
        <DialogTitle className="sr-only">Edit product</DialogTitle>
        {product && (
          <div className="overflow-y-auto max-h-[92vh] no-scrollbar">
            <div className="relative bg-gradient-to-br from-[var(--neon-amber)]/30 to-[var(--neon-pink)]/20 p-5 flex items-center gap-3 sticky top-0 z-10 glass-strong border-b border-white/10">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--neon-amber)]/20">
                <Pencil className="h-5 w-5 text-[var(--neon-amber)]" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold">Edit Product</h2>
                <p className="text-[11px] text-muted-foreground truncate">
                  {product.name}
                </p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="grid h-8 w-8 place-items-center rounded-lg glass hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submit} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Product Name *">
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-white/5 border-white/10"
                    required
                  />
                </Field>
                <Field label="Version">
                  <Input
                    value={form.version}
                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </Field>
              </div>

              <Field label="Tagline">
                <Input
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </Field>

              <Field label="Description">
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-white/5 border-white/10 resize-none"
                  rows={3}
                />
              </Field>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Price (₹) *">
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="bg-white/5 border-white/10"
                    required
                  />
                </Field>
                <Field label="Original Price (₹)">
                  <Input
                    type="number"
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Category">
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-white/10">
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={c.slug}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Type">
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-white/10">
                      <SelectItem value="Panel">Panel</SelectItem>
                      <SelectItem value="Mod Menu">Mod Menu</SelectItem>
                      <SelectItem value="Emulator Tool">Emulator Tool</SelectItem>
                      <SelectItem value="Config">Config</SelectItem>
                      <SelectItem value="Premium File">Premium File</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Compatibility">
                  <Input
                    value={form.compatibility}
                    onChange={(e) => setForm({ ...form, compatibility: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </Field>
                <Field label="Badge">
                  <Select
                    value={form.badge || "none"}
                    onValueChange={(v) => setForm({ ...form, badge: v === "none" ? "" : v })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-white/10">
                      <SelectItem value="none">No badge</SelectItem>
                      <SelectItem value="HOT">HOT</SelectItem>
                      <SelectItem value="NEW">NEW</SelectItem>
                      <SelectItem value="TRENDING">TRENDING</SelectItem>
                      <SelectItem value="DEAL">DEAL</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Thumbnail URL">
                <Input
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </Field>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-magnetic h-11 bg-gradient-to-r from-[var(--neon-amber)] to-[var(--neon-pink)] text-white border-0 glow-amber"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {loading ? "Saving…" : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="glass border-white/15"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
