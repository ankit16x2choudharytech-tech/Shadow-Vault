"use client";

import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Download,
  Heart,
  Receipt,
  User,
  ShieldCheck,
  TrendingUp,
  Package,
  Users,
  IndianRupee,
  ShoppingCart,
  Activity,
  Ticket,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Ban,
  KeyRound,
  Plus,
  MoreHorizontal,
  RefreshCw,
  Crown,
  Zap,
  Trash2,
  Pencil,
  ShieldBan,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useApi, invalidateCache } from "@/lib/use-api";
import type { Order, Product } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "./error-boundary";
import { AddProductModal, AddCouponModal, EditProductModal } from "./admin-forms";
import type { Coupon as CouponType } from "@/lib/types";

const statusStyles: Record<string, string> = {
  PAID: "bg-[var(--neon-emerald)]/20 text-[var(--neon-emerald)] border-[var(--neon-emerald)]/30",
  PENDING: "bg-[var(--neon-amber)]/20 text-[var(--neon-amber)] border-[var(--neon-amber)]/30",
  FAILED: "bg-[var(--neon-pink)]/20 text-[var(--neon-pink)] border-[var(--neon-pink)]/30",
  REFUNDED: "bg-white/10 text-muted-foreground border-white/20",
  CANCELLED: "bg-white/10 text-muted-foreground border-white/20",
  ACTIVE: "bg-[var(--neon-emerald)]/20 text-[var(--neon-emerald)] border-[var(--neon-emerald)]/30",
};

export function Dashboard() {
  const { userRole, userName, customerEmail, setAuthOpen } = useStore();

  // Not logged in → prompt to sign in
  if (userRole === null) {
    return (
      <section className="relative pt-24 pb-20 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="mb-6"
          >
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              <span className="text-gradient">Dashboard</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Sign in to access your dashboard.
            </p>
          </div>

          <div
            className="grad-border p-8 sm:p-12 max-w-2xl mx-auto text-center"
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[var(--neon-violet)] to-[var(--neon-pink)] glow-violet mb-5">
              <ShieldCheck className="h-8 w-8 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold">
              You&apos;re not signed in yet
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Sign in to access your downloads, orders, wishlist &amp; profile.
              New here? Create an account in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
              <Button
                onClick={() => setAuthOpen(true)}
                className="btn-magnetic bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0"
              >
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const isAdmin = userRole === "admin";

  return (
    <section className="relative pt-24 pb-20 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="mb-6 flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {isAdmin ? (
                <>
                  Admin <span className="text-gradient">Console</span>
                </>
              ) : (
                <>
                  My <span className="text-gradient">Dashboard</span>
                </>
              )}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isAdmin
                ? "Manage products, orders, coupons, users & analytics."
                : "Manage your purchases, downloads, wishlist & profile."}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5">
            <div
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full text-white text-xs font-bold",
                isAdmin
                  ? "bg-gradient-to-br from-[var(--neon-amber)] to-[var(--neon-pink)]"
                  : "bg-gradient-to-br from-[var(--neon-violet)] to-[var(--neon-pink)]"
              )}
            >
              {(userName ?? "U").slice(0, 2).toUpperCase()}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium">{userName}</div>
              <div
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wide",
                  isAdmin ? "text-[var(--neon-amber)]" : "text-[var(--neon-violet)]"
                )}
              >
                {isAdmin ? "Administrator" : "Customer"}
              </div>
            </div>
          </div>
        </div>

        {isAdmin ? (
          <ErrorBoundary>
            <AdminDashboard />
          </ErrorBoundary>
        ) : (
          <CustomerDashboard email={customerEmail} />
        )}
      </div>
    </section>
  );
}

/* ============================ CUSTOMER ============================ */

function CustomerDashboard({ email }: { email: string }) {
  const { wishlist, toggleWishlist, setCartOpen, addToCart } = useStore();
  const ordersUrl = `/api/orders?email=${encodeURIComponent(email)}`;
  const { data: orders, loading } = useApi<Order[]>(ordersUrl);
  const { data: allProducts } = useApi<Product[]>("/api/products?limit=12");

  const wishedProducts = useMemo(
    () => (allProducts ?? []).filter((p) => wishlist.includes(p.id)),
    [allProducts, wishlist]
  );

  const paidOrders = useMemo(
    () => (orders ?? []).filter((o) => o.status === "PAID"),
    [orders]
  );
  const totalSpent = paidOrders.reduce((n, o) => n + o.total, 0);

  // derive downloads + purchased items from paid orders (dedupe by productId)
  const { downloads, purchasedItems } = useMemo(() => {
    const items = paidOrders.flatMap((o) => o.items ?? []);
    const seen = new Set<string>();
    const deduped = items.filter((it) => {
      if (seen.has(it.productId)) return false;
      seen.add(it.productId);
      return true;
    });
    return { downloads: deduped, purchasedItems: items };
  }, [paidOrders]);

  // Trigger the actual file download for a purchased product.
  // Looks up the product to find its stored file URL (telegramFileId field),
  // then opens it in a new tab which the browser downloads.
  const handleDownload = async (productId: string, name: string) => {
    try {
      // find the product in the already-fetched list, else fetch all
      let product = (allProducts ?? []).find((p) => p.id === productId);
      if (!product) {
        const res = await fetch("/api/products?limit=200");
        const json = await res.json();
        const all = (json.data ?? json) as Product[];
        product = all.find((p) => p.id === productId);
      }
      if (!product) {
        toast.error("Product not found");
        return;
      }
      const fileUrl = product.telegramFileId;
      if (!fileUrl || fileUrl.startsWith("BAAC")) {
        toast.error("No file available for this product", {
          description: "The seller hasn't uploaded a file yet.",
        });
        return;
      }
      // trigger the browser download
      const a = window.document.createElement("a");
      a.href = fileUrl;
      a.download = name || "download";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      toast.success(`Downloading ${name}`, {
        description: "Your file is being delivered securely.",
      });
    } catch {
      toast.error("Download failed", {
        description: "Please try again or contact support.",
      });
    }
  };

  const [tab, setTab] = useState("overview");
  const tabsList = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "downloads", label: "Downloads", icon: Download },
    { id: "orders", label: "Orders", icon: Receipt },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {tabsList.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all shrink-0",
                active
                  ? "bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white"
                  : "glass text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div>
        {tab === "overview" && (
          <div
            key="overview"
            className="space-y-6"
          >
            {/* stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Package} label="Products Owned" value={downloads.length} color="var(--neon-violet)" trend="+2 this month" />
              <StatCard icon={IndianRupee} label="Total Spent" value={`₹${totalSpent.toLocaleString("en-IN")}`} color="var(--neon-emerald)" trend="+₹4,998" />
              <StatCard icon={Download} label="Downloads" value={purchasedItems.length} color="var(--neon-amber)" trend="Unlimited left" />
              <StatCard icon={Heart} label="Wishlisted" value={wishedProducts.length} color="var(--neon-pink)" trend="Save for later" />
            </div>

            {/* recent orders */}
            <Card className="glass p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Recent Orders</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTab("orders")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  View all
                </Button>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-lg shimmer bg-white/5" />
                  ))}
                </div>
              ) : (orders ?? []).length === 0 ? (
                <EmptyState text="No orders yet. Time to grab something premium!" />
              ) : (
                <div className="space-y-2">
                  {(orders ?? []).slice(0, 4).map((o) => (
                    <OrderRow key={o.id} order={o} />
                  ))}
                </div>
              )}
            </Card>

            {/* latest updates */}
            <Card className="glass p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-[var(--neon-cyan)]" />
                Latest Product Updates
              </h3>
              <div className="space-y-3">
                {downloads.slice(0, 3).map((it) => (
                  <div key={it.id} className="flex items-center gap-3 glass rounded-lg p-3">
                    <img src={it.thumbnail} alt="" className="h-10 w-14 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{it.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Zap className="h-3 w-3 text-[var(--neon-amber)]" />
                        Updated to v{it.version} · Release notes available
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-[var(--neon-cyan)]/40 text-[var(--neon-cyan)]">
                      NEW
                    </Badge>
                  </div>
                ))}
                {downloads.length === 0 && <EmptyState text="No purchases to track updates for yet." />}
              </div>
            </Card>
          </div>
        )}

        {tab === "downloads" && (
          <div
            key="downloads"
          >
            {downloads.length === 0 ? (
              <EmptyState
                icon={Download}
                text="No downloads yet. Browse the marketplace and make your first purchase."
                action
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {downloads.map((it) => (
                  <Card key={it.id} className="glass p-4 group">
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
                      <img src={it.thumbnail} alt={it.name} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <Badge className="absolute top-2 left-2 bg-[var(--neon-emerald)]/90 border-0 text-black">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Owned
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm line-clamp-1">{it.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="rounded bg-white/5 px-1.5 py-0.5">v{it.version}</span>
                      <span>·</span>
                      <span>{it.type}</span>
                    </div>
                    <Button
                      onClick={() => handleDownload(it.productId, it.name)}
                      className="w-full mt-3 btn-magnetic bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0 h-9"
                    >
                      <Download className="h-4 w-4 mr-1.5" />
                      Download
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "orders" && (
          <div
            key="orders"
          >
            <Card className="glass p-5">
              <h3 className="font-semibold mb-4">Order History</h3>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-14 rounded-lg shimmer bg-white/5" />
                  ))}
                </div>
              ) : (orders ?? []).length === 0 ? (
                <EmptyState text="No orders found." />
              ) : (
                <div className="space-y-2">
                  {(orders ?? []).map((o) => (
                    <OrderRow key={o.id} order={o} expanded />
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === "wishlist" && (
          <div
            key="wishlist"
          >
            {wishedProducts.length === 0 ? (
              <EmptyState icon={Heart} text="Your wishlist is empty. Save products to buy later." />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishedProducts.map((p) => (
                  <Card key={p.id} className="glass p-4">
                    <div className="flex gap-3">
                      <img src={p.thumbnail} alt="" className="h-16 w-20 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{p.name}</h4>
                        <div className="text-lg font-bold text-gradient mt-1">
                          ₹{p.price.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => {
                          addToCart({
                            productId: p.id,
                            name: p.name,
                            slug: p.slug,
                            price: p.price,
                            thumbnail: p.thumbnail,
                            version: p.version,
                            type: p.type,
                            quantity: 1,
                          });
                          setCartOpen(true);
                          toast.success(`${p.name} added to cart`);
                        }}
                        className="flex-1 btn-magnetic bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0 h-8"
                      >
                        Move to Cart
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 glass border-white/15"
                        onClick={() => {
                          toggleWishlist(p.id);
                          toast.success("Removed from wishlist");
                        }}
                      >
                        <Heart className="h-3.5 w-3.5 fill-[var(--neon-pink)] text-[var(--neon-pink)]" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "profile" && (
          <div
            key="profile"
            className="grid lg:grid-cols-3 gap-6"
          >
            <Card className="glass p-6 lg:col-span-2">
              <h3 className="font-semibold mb-4">Profile Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <ProfileField label="Full Name" value="Demo Gamer" />
                <ProfileField label="Email" value={email} />
                <ProfileField label="Member Since" value="Jan 2025" />
                <ProfileField label="Account Tier" value="Premium" badge />
                <ProfileField label="Total Orders" value={String((orders ?? []).length)} />
                <ProfileField label="Referral Code" value="DEMO500" />
              </div>
              <div className="flex gap-2 mt-5">
                <Button variant="outline" className="glass border-white/15">
                  <KeyRound className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="glass border-white/15">
                  Enable 2FA
                </Button>
              </div>
            </Card>
            <Card className="glass p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Crown className="h-4 w-4 text-[var(--neon-amber)]" />
                Referral Earnings
              </h3>
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-gradient">₹2,450</div>
                <div className="text-xs text-muted-foreground mt-1">Available to withdraw</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Friends invited</span>
                  <span className="font-medium">14</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conversion rate</span>
                  <span className="font-medium text-[var(--neon-emerald)]">71%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lifetime earnings</span>
                  <span className="font-medium">₹8,920</span>
                </div>
              </div>
              <Button className="w-full mt-4 btn-magnetic bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0">
                Withdraw to Bank
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderRow({ order, expanded }: { order: Order; expanded?: boolean }) {
  return (
    <div className="glass rounded-lg p-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 shrink-0">
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm">{order.orderNumber}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {order.items?.length ?? 0} item(s)
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">₹{order.total.toLocaleString("en-IN")}</span>
          <Badge variant="outline" className={cn("text-[10px] font-semibold", statusStyles[order.status])}>
            {order.status}
          </Badge>
        </div>
      </div>
      {expanded && order.items && order.items.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center gap-2.5">
              <img src={it.thumbnail} alt="" className="h-9 w-12 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{it.name}</div>
                <div className="text-[11px] text-muted-foreground">v{it.version}</div>
              </div>
              <span className="text-sm font-medium">₹{it.price.toLocaleString("en-IN")}</span>
            </div>
          ))}
          {order.status === "PAID" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.success(`Invoice ${order.orderNumber}.pdf downloaded`)}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              <Receipt className="h-3.5 w-3.5 mr-1.5" />
              Download Invoice (PDF)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================ ADMIN ============================ */

function AdminDashboard() {
  const [productRefreshKey, setProductRefreshKey] = useState(0);
  const [orderRefreshKey, setOrderRefreshKey] = useState(0);
  const { data: orders, loading: oloading } = useApi<Order[]>(
    `/api/orders?_=${orderRefreshKey}`
  );
  const { data: products } = useApi<Product[]>(
    `/api/products?limit=12&_=${productRefreshKey}`
  );

  const [tab, setTab] = useState("overview");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [extraCoupons, setExtraCoupons] = useState<CouponType[]>([]);
  const tabsList = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "coupons", label: "Coupons", icon: Ticket },
    { id: "users", label: "Users", icon: Users },
  ];

  const revenue = (orders ?? []).filter((o) => o.status === "PAID").reduce((n, o) => n + o.total, 0);
  const todaysOrders = (orders ?? []).filter(
    (o) => new Date(o.createdAt).toDateString() === new Date().toDateString()
  ).length;
  const refunded = (orders ?? []).filter((o) => o.status === "REFUNDED").length;
  const refundRate = orders && orders.length ? Math.round((refunded / orders.length) * 100) : 0;

  // chart data: simulate 7-day revenue
  const revenueData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((d, i) => ({
      day: d,
      revenue: Math.round(8000 + Math.sin(i * 1.3) * 4000 + Math.random() * 3000),
      orders: Math.round(12 + Math.cos(i) * 6 + Math.random() * 8),
    }));
  }, []);

  const topProducts = useMemo(() => {
    return [...(products ?? [])]
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
      .map((p) => ({ name: p.name.split(" ")[0], sales: p.sales }));
  }, [products]);

  const categoryDist = useMemo(() => {
    const map = new Map<string, number>();
    (products ?? []).forEach((p) => {
      map.set(p.category, (map.get(p.category) ?? 0) + 1);
    });
    const colors = ["#a855f7", "#34d399", "#fbbf24", "#f472b6", "#22d3ee", "#e879f9", "#fb7185"];
    return Array.from(map.entries()).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [products]);

  const pieColors = ["var(--neon-violet)", "var(--neon-emerald)", "var(--neon-amber)", "var(--neon-pink)", "var(--neon-cyan)", "var(--neon-pink)", "var(--neon-amber)"];

  return (
    <div>
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {tabsList.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all shrink-0",
                active
                  ? "bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white"
                  : "glass text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div>
        {tab === "overview" && (
          <div
            key="overview"
            className="space-y-6"
          >
            {/* stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={IndianRupee} label="Total Revenue" value={`₹${revenue.toLocaleString("en-IN")}`} color="var(--neon-emerald)" trend="+18.2%" up />
              <StatCard icon={ShoppingCart} label="Today's Orders" value={todaysOrders + 4} color="var(--neon-violet)" trend="+12%" up />
              <StatCard icon={Users} label="Total Users" value={48527} color="var(--neon-amber)" trend="+324" up />
              <StatCard icon={Activity} label="Refund Rate" value={`${refundRate}%`} color="var(--neon-pink)" trend="-0.4%" up />
            </div>

            {/* charts */}
            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="glass p-5 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Revenue & Orders</h3>
                    <p className="text-xs text-muted-foreground">Last 7 days</p>
                  </div>
                  <Badge variant="outline" className="border-[var(--neon-emerald)]/40 text-[var(--neon-emerald)]">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending up
                  </Badge>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={revenueData} margin={{ left: -16, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--neon-violet)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--neon-violet)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--neon-emerald)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--neon-emerald)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.16 0.02 280 / 0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="var(--neon-violet)" strokeWidth={2} fill="url(#g1)" />
                    <Area type="monotone" dataKey="orders" stroke="var(--neon-emerald)" strokeWidth={2} fill="url(#g2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card className="glass p-5">
                <h3 className="font-semibold mb-1">Category Mix</h3>
                <p className="text-xs text-muted-foreground mb-2">Product distribution</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={categoryDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {categoryDist.map((_, i) => (
                        <Cell key={i} fill={pieColors[i % pieColors.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.16 0.02 280 / 0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {categoryDist.map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 capitalize text-muted-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                        {c.name}
                      </span>
                      <span className="font-medium">{c.value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* top products + recent orders */}
            <div className="grid lg:grid-cols-2 gap-4">
              <Card className="glass p-5">
                <h3 className="font-semibold mb-4">Top Selling Products</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={topProducts} margin={{ left: -20, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      contentStyle={{
                        background: "oklch(0.16 0.02 280 / 0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="sales" radius={[6, 6, 0, 0]} fill="var(--neon-violet)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="glass p-5">
                <h3 className="font-semibold mb-4">Recent Orders</h3>
                {oloading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-12 rounded-lg shimmer bg-white/5" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
                    {(orders ?? []).slice(0, 6).map((o) => (
                      <div key={o.id} className="flex items-center justify-between glass rounded-lg p-2.5">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{o.orderNumber}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{o.customerEmail}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-medium">₹{o.total.toLocaleString("en-IN")}</span>
                          <Badge variant="outline" className={cn("text-[9px] py-0 h-4", statusStyles[o.status])}>
                            {o.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {tab === "products" && (
          <div
            key="products"
          >
            <Card className="glass p-5">
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <h3 className="font-semibold">Product Management</h3>
                <Button
                  size="sm"
                  onClick={() => setProductModalOpen(true)}
                  className="btn-magnetic bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Product
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Product</TableHead>
                      <TableHead className="text-muted-foreground">Category</TableHead>
                      <TableHead className="text-muted-foreground">Price</TableHead>
                      <TableHead className="text-muted-foreground">Sales</TableHead>
                      <TableHead className="text-muted-foreground">Rating</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(products ?? []).map((p) => (
                      <TableRow key={p.id} className="border-white/5">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <img src={p.thumbnail} alt="" className="h-9 w-12 rounded object-cover" />
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate max-w-[160px]">{p.name}</div>
                              <div className="text-[11px] text-muted-foreground">v{p.version}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm capitalize text-muted-foreground">{p.category}</TableCell>
                        <TableCell className="text-sm font-medium">₹{p.price.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-sm">{p.sales.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-sm">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[var(--neon-amber)]">★</span>
                            {p.rating.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px]", statusStyles[p.status])}>
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setEditProduct(p)}
                              title="Edit product"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-[var(--neon-pink)]"
                              onClick={async () => {
                                if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
                                try {
                                  const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
                                  if (!res.ok) throw new Error("Failed");
                                  toast.success(`Deleted ${p.name}`);
                                  setProductRefreshKey((k) => k + 1);
                                } catch {
                                  toast.error("Delete failed");
                                }
                              }}
                              title="Delete product"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}

        {tab === "orders" && (
          <div
            key="orders"
          >
            <Card className="glass p-5">
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <h3 className="font-semibold">Order Management</h3>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search orders…" className="pl-9 bg-white/5 border-white/10 h-9" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Order</TableHead>
                      <TableHead className="text-muted-foreground">Customer</TableHead>
                      <TableHead className="text-muted-foreground">Total</TableHead>
                      <TableHead className="text-muted-foreground">Payment</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(orders ?? []).map((o) => (
                      <TableRow key={o.id} className="border-white/5">
                        <TableCell className="font-medium text-sm">{o.orderNumber}</TableCell>
                        <TableCell>
                          <div className="text-sm">{o.customerName}</div>
                          <div className="text-[11px] text-muted-foreground">{o.customerEmail}</div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">₹{o.total.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{o.paymentId ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px]", statusStyles[o.status])}>
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {o.status === "PAID" && (
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.error(`No refund — all sales are final (per policy)`, { description: `Order ${o.orderNumber} · digital product already delivered` })}>
                                Refund
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-[var(--neon-pink)]"
                              onClick={async () => {
                                if (!confirm(`Delete order ${o.orderNumber}? This cannot be undone.`)) return;
                                try {
                                  const res = await fetch(`/api/orders/${o.id}`, { method: "DELETE" });
                                  if (!res.ok) throw new Error("Failed");
                                  toast.success(`Order ${o.orderNumber} deleted`);
                                  setOrderRefreshKey((k) => k + 1);
                                } catch {
                                  toast.error("Delete failed");
                                }
                              }}
                              title="Delete order"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}

        {tab === "coupons" && (
          <div
            key="coupons"
          >
            <CouponManagement />
          </div>
        )}

        {tab === "users" && (
          <div key="users">
            <UserManagement />
          </div>
        )}
      </div>

      {/* Add Product modal — real form that creates products via API */}
      <AddProductModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        onCreated={() => setProductRefreshKey((k) => k + 1)}
      />
      {/* Edit Product modal */}
      <EditProductModal
        product={editProduct}
        onOpenChange={(o) => !o && setEditProduct(null)}
        onSaved={() => setProductRefreshKey((k) => k + 1)}
      />
    </div>
  );
}

/* ============================ USER MANAGEMENT ============================ */

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  tier: string;
  orders: number;
  spent: number;
  createdAt: string;
}

function UserManagement() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const { data: users, loading } = useApi<AdminUser[]>(
    `/api/users?_=${refreshKey}`
  );

  const filtered = (users ?? []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleBan = async (u: AdminUser) => {
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned: !u.banned }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(u.banned ? `Unbanned ${u.name}` : `Banned ${u.name}`);
      invalidateCache(`/api/users?_=${refreshKey}`);
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Action failed");
    }
  };

  const resetPassword = async (u: AdminUser) => {
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "reset1234" }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Password reset for ${u.name}`, {
        description: "Temporary password: reset1234",
      });
    } catch {
      toast.error("Reset failed");
    }
  };

  const deleteUser = async (u: AdminUser) => {
    if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Deleted ${u.name}`);
      invalidateCache(`/api/users?_=${refreshKey}`);
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <Card className="glass p-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="font-semibold">
          User Management
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {(users ?? []).length} total
          </span>
        </h3>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="pl-9 bg-white/5 border-white/10 h-9"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Tier</TableHead>
              <TableHead className="text-muted-foreground">Orders</TableHead>
              <TableHead className="text-muted-foreground">Spent</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Loading users…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <TableRow key={u.id} className="border-white/5">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[var(--neon-violet)] to-[var(--neon-pink)] text-white text-xs font-bold">
                        {u.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <div className="text-sm font-medium flex items-center gap-1.5">
                          {u.name}
                          {u.role === "admin" && (
                            <Badge variant="outline" className="text-[9px] py-0 h-4 border-[var(--neon-amber)]/40 text-[var(--neon-amber)]">
                              <Crown className="h-2.5 w-2.5 mr-0.5" />
                              ADMIN
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px]", u.tier === "Premium" ? "border-[var(--neon-amber)]/40 text-[var(--neon-amber)]" : "")}>
                      {u.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{u.orders}</TableCell>
                  <TableCell className="text-sm font-medium">₹{u.spent.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px]", u.banned ? "border-[var(--neon-pink)]/40 text-[var(--neon-pink)]" : "border-[var(--neon-emerald)]/40 text-[var(--neon-emerald)]")}>
                      {u.banned ? "BANNED" : "ACTIVE"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => resetPassword(u)}
                        title="Reset password"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn("h-7 w-7", u.banned ? "text-[var(--neon-emerald)]" : "text-[var(--neon-pink)]")}
                        onClick={() => toggleBan(u)}
                        title={u.banned ? "Unban" : "Ban"}
                      >
                        {u.banned ? <ShieldCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                      </Button>
                      {u.role !== "admin" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-[var(--neon-pink)]"
                          onClick={() => deleteUser(u)}
                          title="Delete user"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function CouponManagement() {
  const [couponRefreshKey, setCouponRefreshKey] = useState(0);
  const { data: dbCoupons } = useApi<CouponType[]>(
    `/api/coupons?_=${couponRefreshKey}`
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [newCoupons, setNewCoupons] = useState<CouponType[]>([]);

  const deleteCoupon = async (c: CouponType) => {
    if (!confirm(`Delete coupon "${c.code}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/coupons/${c.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Coupon ${c.code} deleted`);
      invalidateCache(`/api/coupons?_=${couponRefreshKey}`);
      setNewCoupons((prev) => prev.filter((nc) => nc.id !== c.id));
      setCouponRefreshKey((k) => k + 1);
    } catch {
      toast.error("Delete failed");
    }
  };

  // merge DB coupons with newly created ones (new ones shown first)
  const allCoupons = [...newCoupons, ...(dbCoupons ?? [])];

  return (
    <Card className="glass p-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="font-semibold">Coupon Management</h3>
        <Button
          size="sm"
          onClick={() => setModalOpen(true)}
          className="btn-magnetic bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Coupon
        </Button>
      </div>

      {allCoupons.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No coupons yet. Click &quot;New Coupon&quot; to create one.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allCoupons.map((c) => {
            const used = c.usedCount ?? 0;
            const limit = c.usageLimit ?? 100;
            const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;
            const isNew = newCoupons.some((nc) => nc.id === c.id);
            return (
              <div key={c.id} className="grad-border p-4 relative">
                {isNew && (
                  <span className="absolute -top-2 -right-2 rounded-full bg-[var(--neon-emerald)] px-2 py-0.5 text-[9px] font-bold text-black">
                    NEW
                  </span>
                )}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bold text-lg tracking-wide text-gradient">
                      {c.code}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.type === "PERCENT"
                        ? `${c.value}% off`
                        : `₹${c.value} off`}
                      {c.minAmount ? ` · min ₹${c.minAmount}` : ""}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      c.active
                        ? "border-[var(--neon-emerald)]/40 text-[var(--neon-emerald)]"
                        : "border-white/20 text-muted-foreground"
                    )}
                  >
                    {c.active ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span>{used} used</span>
                    <span>{Math.max(0, limit - used)} left</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-[11px] text-muted-foreground">
                    Expires{" "}
                    {new Date(c.expiry).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteCoupon(c)}
                    className="grid h-6 w-6 place-items-center rounded-lg glass hover:bg-[var(--neon-pink)]/20 text-muted-foreground hover:text-[var(--neon-pink)] transition-colors"
                    title="Delete coupon"
                    aria-label="Delete coupon"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddCouponModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(c) => setNewCoupons((prev) => [c, ...prev])}
      />
    </Card>
  );
}

/* ============================ Shared bits ============================ */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  trend,
  up,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  trend?: string;
  up?: boolean;
}) {
  return (
    <Card className="glass p-4 relative overflow-hidden group">
      <div
        className="absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-25 group-hover:opacity-40 transition-opacity"
        style={{ background: color }}
      />
      <div className="flex items-center justify-between mb-2 relative">
        <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${color}22` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        {trend && (
          <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-medium", up ? "text-[var(--neon-emerald)]" : "text-[var(--neon-emerald)]")}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold relative">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5 relative">{label}</div>
    </Card>
  );
}

function ProfileField({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      {badge ? (
        <Badge variant="outline" className="border-[var(--neon-amber)]/40 text-[var(--neon-amber)]">{value}</Badge>
      ) : (
        <div className="text-sm font-medium">{value}</div>
      )}
    </div>
  );
}

function EmptyState({
  text,
  icon: Icon = Package,
  action,
}: {
  text: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: boolean;
}) {
  const { setView } = useStore();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl glass mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground max-w-xs">{text}</p>
      {action && (
        <Button
          onClick={() => setView("marketplace")}
          className="mt-5 btn-magnetic bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0"
        >
          Browse Marketplace
        </Button>
      )}
    </div>
  );
}
