// ShadowVault - Database seed script
// Run with: bun prisma/seed.ts  (or: bunx prisma db seed)
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function img(id: string, w = 800, q = 80): string {
  return `https://images.unsplash.com/${id}?w=${w}&q=${q}`;
}

function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function randomToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  let out = "BAACAgIAAxkBAAIBZ2X";
  for (let i = 0; i < 48; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Data definitions
// ---------------------------------------------------------------------------
const PHOTO_POOL = [
  "photo-1542751371-adc38448a05e",
  "photo-1511512578047-dfb367046420",
  "photo-1538481199705-c710c4e965fc",
  "photo-1550745165-9bc0b252726f",
  "photo-1593305841991-05c297ba4575",
  "photo-1493711662062-fa541adb3fc8",
  "photo-1620712943543-bcc4688e7485",
  "photo-1518709268805-4e9042af2176",
  "photo-1551103782-8ab07afd45c1",
  "photo-1598842057894-37bbff5f02b5",
  "photo-1605379399642-870262d3d051",
];

const CATEGORIES = [
  {
    name: "Game Panels",
    slug: "game-panels",
    icon: "LayoutDashboard",
    color: "violet",
    description: "High-performance overlay panels for competitive domination.",
  },
  {
    name: "Private Tools",
    slug: "private-tools",
    icon: "Wrench",
    color: "emerald",
    description: "Exclusive private cheat & utility builds, invite-only tier.",
  },
  {
    name: "Configs",
    slug: "configs",
    icon: "Settings2",
    color: "amber",
    description: "Tuned config packs that squeeze every drop of performance.",
  },
  {
    name: "Scripts",
    slug: "scripts",
    icon: "Code2",
    color: "pink",
    description: "Automation & macro scripts to streamline your grind.",
  },
  {
    name: "Utilities",
    slug: "utilities",
    icon: "Plug",
    color: "cyan",
    description: "Emulators, boosters and system utilities that just work.",
  },
  {
    name: "Premium Files",
    slug: "premium-files",
    icon: "Crown",
    color: "fuchsia",
    description: "Flagship premium files for elite operators only.",
  },
  {
    name: "Subscriptions",
    slug: "subscriptions",
    icon: "CreditCard",
    color: "rose",
    description: "Recurring access tiers with daily updates and priority support.",
  },
];

interface ProductSeed {
  name: string;
  category: string; // slug
  type: string;
  badge?: string | null;
  tagline: string;
  description: string;
  thumbnail: string;
  banner: string;
  version: string;
  price: number;
  originalPrice: number;
  compatibility: string;
  fileSize: string;
  releaseDate: Date;
  features: string[];
  whatsNew: string[];
  requirements: string[];
  rating: number;
  sales: number;
  views: number;
}

const PRODUCTS: ProductSeed[] = [
  {
    name: "PhantomStrike Pro Panel",
    category: "game-panels",
    type: "Panel",
    badge: "HOT",
    tagline: "Undetectable ESP + Aimbot overlay tuned for ranked chaos.",
    description:
      "PhantomStrike Pro is our flagship competitive panel featuring a low-latency DirectX overlay, predictive aimbot trajectories and a fully customizable ESP suite. Built for ranked warriors who refuse to settle.",
    thumbnail: img("photo-1542751371-adc38448a05e"),
    banner: img("photo-1538481199705-c710c4e965fc", 1200),
    version: "4.2.1",
    price: 2499,
    originalPrice: 3999,
    compatibility: "Windows 10/11, Android 12+",
    fileSize: "24.5 MB",
    releaseDate: new Date("2025-02-14"),
    features: [
      "Predictive aimbot with smoothing sliders",
      "Player ESP with distance & health bars",
      "Stream-proof overlay (OBS safe)",
      "Configurable FOV & bone priority",
      "HWID spoofed loader",
      "24/7 Telegram priority support",
    ],
    whatsNew: [
      "v4.2.1 — Reduced overlay CPU usage by 38%",
      "v4.2.0 — Added Android 14 compatibility",
      "v4.1.5 — New smoothing presets (Legit / Rage / Sniper)",
      "v4.1.0 — Stream-proof mode rewritten",
    ],
    requirements: [
      "Windows 10 64-bit or newer",
      "8 GB RAM minimum",
      "DirectX 11 compatible GPU",
      "Stable internet for license check",
    ],
    rating: 4.8,
    sales: 8740,
    views: 48200,
  },
  {
    name: "Nexus Mod Menu v4",
    category: "private-tools",
    type: "Mod Menu",
    badge: "TRENDING",
    tagline: "500+ injectable mods with one-click toggles.",
    description:
      "Nexus Mod Menu v4 brings a sleek in-game menu with hundreds of injectable mods, real-time tunables and a built-in save manager. The cleanest modding experience on the market.",
    thumbnail: img("photo-1511512578047-dfb367046420"),
    banner: img("photo-1550745165-9bc0b252726f", 1200),
    version: "4.0.3",
    price: 1299,
    originalPrice: 1999,
    compatibility: "Windows 10/11, Android 11+",
    fileSize: "18.2 MB",
    releaseDate: new Date("2025-03-22"),
    features: [
      "500+ modular mods with one-click toggles",
      "In-game overlay with search & favorites",
      "Save state manager with cloud sync",
      "Per-mod keybinds",
      "Auto-update on launch",
    ],
    whatsNew: [
      "v4.0.3 — Patched crash on alt-tab",
      "v4.0.0 — Full UI rewrite with theme support",
      "v3.9.2 — Added 40 new mods this cycle",
      "v3.9.0 — Cloud sync now stable",
    ],
    requirements: [
      "Windows 10 64-bit or Android 11+",
      "4 GB RAM minimum",
      ".NET 6 runtime (auto-installed)",
      "Root access recommended on Android",
    ],
    rating: 4.6,
    sales: 5210,
    views: 31200,
  },
  {
    name: "Vortex Emulator Suite",
    category: "utilities",
    type: "Emulator Tool",
    badge: "NEW",
    tagline: "Run any mobile shooter on PC with sub-10ms input latency.",
    description:
      "Vortex Emulator Suite is a next-gen Android emulator built specifically for mobile FPS titles. Custom keymapping, GPU passthrough and a tuned kernel keep your inputs razor sharp.",
    thumbnail: img("photo-1493711662062-fa541adb3fc8"),
    banner: img("photo-1605379399642-870262d3d051", 1200),
    version: "2.6.0",
    price: 999,
    originalPrice: 1499,
    compatibility: "Windows 10/11",
    fileSize: "320 MB",
    releaseDate: new Date("2025-04-10"),
    features: [
      "Custom kernel tuned for FPS titles",
      "Per-game keymapping profiles",
      "GPU passthrough for high refresh rates",
      "Built-in macro recorder",
      "Multi-instance manager",
    ],
    whatsNew: [
      "v2.6.0 — Added 240Hz support",
      "v2.5.4 — Fixed Vulkan crash on NVIDIA",
      "v2.5.0 — New keymapping UI",
      "v2.4.2 — Reduced idle RAM by 1.2GB",
    ],
    requirements: [
      "Windows 10 64-bit",
      "16 GB RAM recommended",
      "VT-x / SVM enabled in BIOS",
      "Dedicated GPU strongly recommended",
    ],
    rating: 4.5,
    sales: 3120,
    views: 18900,
  },
  {
    name: "Apex Config Pack",
    category: "configs",
    type: "Config",
    badge: "DEAL",
    tagline: "Pro-tier FPS configs handcrafted by ex-pro players.",
    description:
      "The Apex Config Pack bundles 25 hand-tuned configs for popular competitive titles. Each config is benchmarked on high-refresh monitors and calibrated for minimum input lag.",
    thumbnail: img("photo-1593305841991-05c297ba4575"),
    banner: img("photo-1551103782-8ab07afd45c1", 1200),
    version: "3.1.0",
    price: 499,
    originalPrice: 999,
    compatibility: "Windows 10/11, Android 12+",
    fileSize: "6.4 MB",
    releaseDate: new Date("2025-01-30"),
    features: [
      "25 pro-tuned configs across 8 titles",
      "Per-refresh-rate presets (144/240/360)",
      "Auto-backup of existing configs",
      "One-click apply with rollback",
      "Detailed changelog per config",
    ],
    whatsNew: [
      "v3.1.0 — Added 6 new configs for 2025 season",
      "v3.0.5 — Rollback now preserves keybinds",
      "v3.0.0 — Refactor to per-title packs",
      "v2.9.0 — Added 144Hz baseline presets",
    ],
    requirements: [
      "Windows 10 64-bit or Android 12+",
      "Target game installed",
      "2 MB free disk space",
      "Admin rights for apply step",
    ],
    rating: 4.4,
    sales: 6780,
    views: 22400,
  },
  {
    name: "ShadowBot Automation Script",
    category: "scripts",
    type: "Config",
    badge: null,
    tagline: "Automate your daily grind with human-like macro patterns.",
    description:
      "ShadowBot is a Lua-powered automation engine that mimics human input patterns to keep your accounts safe while farming resources, dailies or ranked placement matches.",
    thumbnail: img("photo-1620712943543-bcc4688e7485"),
    banner: img("photo-1542751371-adc38448a05e", 1200),
    version: "1.8.2",
    price: 799,
    originalPrice: 1299,
    compatibility: "Windows 10/11",
    fileSize: "12.1 MB",
    releaseDate: new Date("2025-02-28"),
    features: [
      "Lua scripting engine with 60+ API calls",
      "Human-like jitter & dwell simulation",
      "Schedule-based task runner",
      "Per-account profile isolation",
      "Web dashboard for remote control",
    ],
    whatsNew: [
      "v1.8.2 — Added remote dashboard",
      "v1.8.0 — New dwell-time algorithm",
      "v1.7.4 — Profile isolation hardened",
      "v1.7.0 — Schedule runner rewritten",
    ],
    requirements: [
      "Windows 10 64-bit",
      "4 GB RAM minimum",
      "Lua 5.4 runtime (bundled)",
      "Internet for dashboard sync",
    ],
    rating: 4.3,
    sales: 2980,
    views: 14700,
  },
  {
    name: "Titanium Overlay Engine",
    category: "game-panels",
    type: "Panel",
    badge: "HOT",
    tagline: "Modular overlay engine for streamers and pros alike.",
    description:
      "Titanium Overlay Engine delivers a fully modular overlay system with widgets for FPS, kill feed, ping graph and custom alerts. Stream-ready with zero-latency rendering.",
    thumbnail: img("photo-1518709268805-4e9042af2176"),
    banner: img("photo-1605379399642-870262d3d051", 1200),
    version: "5.0.1",
    price: 1999,
    originalPrice: 2999,
    compatibility: "Windows 10/11",
    fileSize: "31.7 MB",
    releaseDate: new Date("2025-03-05"),
    features: [
      "Drag-and-drop widget editor",
      "OBS / StreamLabs native capture",
      "Per-game profile auto-switching",
      "Custom alert webhooks",
      "60 FPS overlay rendering",
    ],
    whatsNew: [
      "v5.0.1 — Fixed OBS capture flicker",
      "v5.0.0 — Full widget engine rewrite",
      "v4.4.2 — Added 8 new widgets",
      "v4.4.0 — Webhook alert system",
    ],
    requirements: [
      "Windows 10 64-bit",
      "8 GB RAM minimum",
      "DirectX 11 GPU",
      "OBS Studio 30+ (optional)",
    ],
    rating: 4.7,
    sales: 4520,
    views: 26800,
  },
  {
    name: "LunarAim Premium File",
    category: "premium-files",
    type: "Premium File",
    badge: null,
    tagline: "Signature aim file curated by Lunar — 1v9 your lobbies.",
    description:
      "LunarAim Premium File is a hand-tuned aim configuration built by Twitch veteran Lunar. Includes personalized smoothing, recoil control and a private Q&A channel.",
    thumbnail: img("photo-1598842057894-37bbff5f02b5"),
    banner: img("photo-1511512578047-dfb367046420", 1200),
    version: "2.3.0",
    price: 3499,
    originalPrice: 4999,
    compatibility: "Windows 10/11",
    fileSize: "4.8 MB",
    releaseDate: new Date("2025-04-18"),
    features: [
      "Hand-tuned by Lunar (Twitch veteran)",
      "Per-weapon recoil curves",
      "Smoothing profile matched to your sens",
      "Private Telegram Q&A channel access",
      "Lifetime updates for current season",
    ],
    whatsNew: [
      "v2.3.0 — New recoil curves for 2025 patch",
      "v2.2.5 — Sens-matching algorithm improved",
      "v2.2.0 — Added 4 new weapon profiles",
      "v2.1.0 — Q&A channel launched",
    ],
    requirements: [
      "Windows 10 64-bit",
      "Target game installed",
      "2 MB free disk space",
      "Telegram account for support",
    ],
    rating: 4.9,
    sales: 1840,
    views: 21300,
  },
  {
    name: "Cipher Streamer Kit",
    category: "subscriptions",
    type: "Premium File",
    badge: "NEW",
    tagline: "Monthly drop of streamer overlays, alerts & bot scripts.",
    description:
      "Cipher Streamer Kit is a recurring monthly subscription that delivers fresh overlays, animated alerts, chat bot scripts and a royalty-free music pack every 30 days.",
    thumbnail: img("photo-1551103782-8ab07afd45c1"),
    banner: img("photo-1538481199705-c710c4e965fc", 1200),
    version: "1.4.0",
    price: 1299,
    originalPrice: 1799,
    compatibility: "Windows 10/11, macOS 12+",
    fileSize: "480 MB",
    releaseDate: new Date("2025-05-02"),
    features: [
      "Monthly overlay pack (5 themes)",
      "Animated alert library (60+ clips)",
      "Chat bot script library",
      "Royalty-free music pack",
      "Priority support in Cipher Discord",
    ],
    whatsNew: [
      "v1.4.0 — May drop live",
      "v1.3.5 — Bot scripts refactored",
      "v1.3.0 — Added 4 new alert templates",
      "v1.2.0 — Music pack expanded to 40 tracks",
    ],
    requirements: [
      "Windows 10 64-bit or macOS 12+",
      "8 GB RAM minimum",
      "OBS Studio 30+ recommended",
      "Discord account for support",
    ],
    rating: 4.6,
    sales: 980,
    views: 11200,
  },
  {
    name: "Wraith Performance Booster",
    category: "utilities",
    type: "Emulator Tool",
    badge: null,
    tagline: "Squeeze every frame with our ghost-light booster engine.",
    description:
      "Wraith Performance Booster is a system-level optimizer that suspends background bloat, defrags shader caches and locks CPU affinity for maximum FPS in your favorite titles.",
    thumbnail: img("photo-1605379399642-870262d3d051"),
    banner: img("photo-1493711662062-fa541adb3fc8", 1200),
    version: "3.5.2",
    price: 599,
    originalPrice: 999,
    compatibility: "Windows 10/11",
    fileSize: "9.6 MB",
    releaseDate: new Date("2025-01-12"),
    features: [
      "One-click game-mode booster",
      "Background service suspender",
      "Shader cache defrag",
      "CPU affinity locker",
      "Real-time FPS overlay",
    ],
    whatsNew: [
      "v3.5.2 — Fixed affinity lock on Ryzen",
      "v3.5.0 — New shader defrag engine",
      "v3.4.4 — Added 30+ game profiles",
      "v3.4.0 — FPS overlay rewritten",
    ],
    requirements: [
      "Windows 10 64-bit",
      "4 GB RAM minimum",
      "Admin rights required",
      "10 MB free disk space",
    ],
    rating: 4.2,
    sales: 4120,
    views: 19600,
  },
  {
    name: "Spectre Config Vault",
    category: "configs",
    type: "Config",
    badge: "DEAL",
    tagline: "Lifetime access to a growing vault of 200+ configs.",
    description:
      "Spectre Config Vault grants lifetime access to a continuously updated vault of 200+ configs across 12 titles. New configs added weekly by our pro team.",
    thumbnail: img("photo-1538481199705-c710c4e965fc"),
    banner: img("photo-1593305841991-05c297ba4575", 1200),
    version: "6.2.0",
    price: 899,
    originalPrice: 1499,
    compatibility: "Windows 10/11, Android 12+",
    fileSize: "14.3 MB",
    releaseDate: new Date("2025-02-05"),
    features: [
      "200+ configs across 12 titles",
      "Weekly new config drops",
      "One-click apply & rollback",
      "Config comparison tool",
      "Community rating & comments",
    ],
    whatsNew: [
      "v6.2.0 — Added 12 new configs this week",
      "v6.1.3 — Comparison tool launched",
      "v6.1.0 — Community ratings enabled",
      "v6.0.0 — Vault UI fully rebuilt",
    ],
    requirements: [
      "Windows 10 64-bit or Android 12+",
      "Target game installed",
      "5 MB free disk space",
      "Admin rights for apply step",
    ],
    rating: 4.5,
    sales: 5460,
    views: 28100,
  },
  {
    name: "Eclipse Panel Elite",
    category: "game-panels",
    type: "Panel",
    badge: "TRENDING",
    tagline: "All-in-one elite panel with radar, recoil & more.",
    description:
      "Eclipse Panel Elite combines radar hack, recoil control, ESP and a tunable aimbot into one sleek package. The most feature-complete panel in the ShadowVault catalog.",
    thumbnail: img("photo-1550745165-9bc0b252726f"),
    banner: img("photo-1518709268805-4e9042af2176", 1200),
    version: "7.0.4",
    price: 3999,
    originalPrice: 5999,
    compatibility: "Windows 10/11",
    fileSize: "42.8 MB",
    releaseDate: new Date("2025-03-29"),
    features: [
      "2D/3D radar with custom range",
      "Per-weapon recoil control",
      "Full ESP customization suite",
      "Tunable aimbot with bone priority",
      "Stream-safe overlay",
      "VIP Telegram priority support",
    ],
    whatsNew: [
      "v7.0.4 — Hotfix for radar flicker",
      "v7.0.0 — Major panel rewrite",
      "v6.8.2 — Added 3D radar mode",
      "v6.8.0 — Recoil engine v2",
    ],
    requirements: [
      "Windows 10 64-bit",
      "16 GB RAM recommended",
      "DirectX 12 GPU",
      "Stable internet for license check",
    ],
    rating: 4.8,
    sales: 2240,
    views: 33500,
  },
  {
    name: "Nova Tournament Pack",
    category: "premium-files",
    type: "Premium File",
    badge: null,
    tagline: "Tournament-grade file bundle used by semi-pro teams.",
    description:
      "Nova Tournament Pack is a curated bundle of tournament-grade files used by semi-pro teams in scrims. Includes configs, recoil maps and a private strategy doc.",
    thumbnail: img("photo-1593305841991-05c297ba4575"),
    banner: img("photo-1620712943543-bcc4688e7485", 1200),
    version: "2.0.0",
    price: 4999,
    originalPrice: 7499,
    compatibility: "Windows 10/11",
    fileSize: "22.0 MB",
    releaseDate: new Date("2025-04-25"),
    features: [
      "Tournament-validated configs",
      "Per-map recoil maps",
      "Private strategy PDF (40+ pages)",
      "Team license for 5 players",
      "Coaching session discount voucher",
    ],
    whatsNew: [
      "v2.0.0 — Full tournament refresh",
      "v1.4.2 — Added 4 new map recoil maps",
      "v1.4.0 — Strategy doc updated",
      "v1.3.0 — Team license system added",
    ],
    requirements: [
      "Windows 10 64-bit",
      "Target game installed",
      "PDF reader for strategy doc",
      "Discord for coaching voucher",
    ],
    rating: 4.7,
    sales: 720,
    views: 16400,
  },
];

// Reviews for ~6 popular products (by name)
const REVIEW_NAMES = [
  "ArjunVerma",
  "RiyaPro",
  "Karthik_GG",
  "ZaidPlays",
  "NehaSnipes",
  "RahulClutch",
  "ImranFTW",
  "SnehaHeadshot",
  "VivekFPS",
  "AishaGG",
];

const REVIEW_COMMENTS = [
  "Bhai solid hai, ranked me direct push kar diya. Worth every rupee.",
  "Setup took 5 mins, no ban in 3 weeks. Customer support bhi quick hai.",
  "Overlay is super clean, OBS me bhi nahi dikhta. Highly recommended.",
  "Paisa vasool. Recoil control alone is worth the price.",
  "Tournament pack helped our team win scrims. Strategy doc is gold.",
  "Thoda expensive laga pehle but after first match — totally worth it.",
  "Android pe bhi chal raha hai smoothly. Big W for mobile players.",
  "Updates regular aate hain, dev team actually cares. 5 stars.",
  "Configs ka bundle insane hai. 240Hz monitor pe butter smooth.",
  "Telegram support ne 2 min me reply diya at 1 AM. Mad respect.",
];

interface ReviewSeed {
  productName: string;
  userName: string;
  rating: number;
  comment: string;
  verified: boolean;
  likes: number;
  date: Date;
}

function buildReviews(): ReviewSeed[] {
  const popular = [
    "PhantomStrike Pro Panel",
    "Nexus Mod Menu v4",
    "Apex Config Pack",
    "Titanium Overlay Engine",
    "LunarAim Premium File",
    "Eclipse Panel Elite",
  ];
  const out: ReviewSeed[] = [];
  popular.forEach((productName, pIdx) => {
    const count = 3 + (pIdx % 3); // 3-5
    const names = pick(REVIEW_NAMES, count);
    const comments = pick(REVIEW_COMMENTS, count);
    for (let i = 0; i < count; i++) {
      const monthOffset = (pIdx + i) % 9; // spread across 2025
      out.push({
        productName,
        userName: names[i],
        rating: 4 + (i % 2 === 0 ? 1 : 0), // 4 or 5
        comment: comments[i],
        verified: i !== 0 ? true : pIdx % 2 === 0, // mostly verified
        likes: Math.floor(Math.random() * 120),
        date: new Date(2025, monthOffset, 5 + ((pIdx * 3 + i * 7) % 22)),
      });
    }
  });
  return out;
}

const COUPONS = [
  {
    code: "WELCOME10",
    type: "PERCENT",
    value: 10,
    minAmount: 499,
    maxDiscount: 500,
    usageLimit: 1000,
    expiry: new Date("2026-12-31"),
  },
  {
    code: "SHADOW20",
    type: "PERCENT",
    value: 20,
    minAmount: 1499,
    maxDiscount: 1000,
    usageLimit: 500,
    expiry: new Date("2026-06-30"),
  },
  {
    code: "FLAT200",
    type: "FLAT",
    value: 200,
    minAmount: 999,
    maxDiscount: null,
    usageLimit: 300,
    expiry: new Date("2026-09-30"),
  },
  {
    code: "GAMER500",
    type: "FLAT",
    value: 500,
    minAmount: 2999,
    maxDiscount: null,
    usageLimit: 200,
    expiry: new Date("2026-12-31"),
  },
  {
    code: "FIRSTBUY",
    type: "PERCENT",
    value: 15,
    minAmount: 299,
    maxDiscount: 300,
    usageLimit: 2000,
    expiry: new Date("2027-01-31"),
  },
];

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------
async function main() {
  console.log("🧹 Clearing existing data...");
  await db.review.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.coupon.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.user.deleteMany();

  console.log("👥 Inserting users...");
  const seedUsers = [
    { name: "Demo Gamer", email: "demo@shadowvault.in", password: "test1234", role: "customer", tier: "Premium", orders: 4, spent: 11594 },
    { name: "Vault Admin", email: "admin@shadowvault.in", password: "admin123", role: "admin", tier: "Premium", orders: 0, spent: 0 },
    { name: "Arjun Verma", email: "arjun@gmail.com", password: "pass1234", role: "customer", tier: "Premium", orders: 14, spent: 18999 },
    { name: "Riya Kapoor", email: "riya@gmail.com", password: "pass1234", role: "customer", tier: "Premium", orders: 9, spent: 12450 },
    { name: "Karthik Reddy", email: "karthik@gmail.com", password: "pass1234", role: "customer", tier: "Standard", orders: 4, spent: 3200 },
    { name: "Zaid Khan", email: "zaid@gmail.com", password: "pass1234", role: "customer", tier: "Premium", orders: 22, spent: 34700 },
    { name: "Suspicious User", email: "spam@temp.com", password: "pass1234", role: "customer", tier: "Standard", orders: 1, spent: 499, banned: true },
    { name: "Ananya Singh", email: "ananya@gmail.com", password: "pass1234", role: "customer", tier: "Standard", orders: 7, spent: 8990 },
  ];
  for (const u of seedUsers) {
    await db.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: `hash_${Buffer.from(u.password).toString("base64")}`,
        role: u.role,
        tier: u.tier,
        orders: u.orders,
        spent: u.spent,
        banned: u.banned ?? false,
      },
    });
  }
  console.log(`   Seeded ${seedUsers.length} users`);

  console.log("📂 Inserting categories...");
  for (const c of CATEGORIES) {
    await db.category.create({ data: c });
  }

  console.log("🎮 Inserting products...");
  const productSlugMap = new Map<string, string>(); // name -> slug
  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    productSlugMap.set(p.name, slug);
    const screenshots = pick(PHOTO_POOL, 4).map((id) =>
      img(id, 1200, 80)
    );
    await db.product.create({
      data: {
        name: p.name,
        slug,
        tagline: p.tagline,
        description: p.description,
        thumbnail: p.thumbnail,
        banner: p.banner,
        version: p.version,
        price: p.price,
        originalPrice: p.originalPrice,
        category: p.category,
        type: p.type,
        compatibility: p.compatibility,
        fileSize: p.fileSize,
        releaseDate: p.releaseDate,
        telegramFileId: "/uploads/sample-readme.txt",
        status: "ACTIVE",
        rating: p.rating,
        sales: p.sales,
        views: p.views,
        features: JSON.stringify(p.features),
        screenshots: JSON.stringify(screenshots),
        whatsNew: JSON.stringify(p.whatsNew),
        requirements: JSON.stringify(p.requirements),
        badge: p.badge ?? null,
      },
    });
  }

  console.log("⭐ Inserting reviews...");
  const reviews = buildReviews();
  for (const r of reviews) {
    const slug = productSlugMap.get(r.productName);
    if (!slug) continue;
    const product = await db.product.findUnique({ where: { slug } });
    if (!product) continue;
    await db.review.create({
      data: {
        productId: product.id,
        userName: r.userName,
        rating: r.rating,
        comment: r.comment,
        verified: r.verified,
        likes: r.likes,
        date: r.date,
      },
    });
  }

  console.log("📊 Recalculating product ratings from reviews...");
  const allProducts = await db.product.findMany({ include: { reviews: true } });
  for (const p of allProducts) {
    if (p.reviews.length > 0) {
      const avg =
        p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length;
      const rounded = Math.round(avg * 10) / 10;
      await db.product.update({
        where: { id: p.id },
        data: { rating: rounded },
      });
    }
  }

  console.log("🎟️  Inserting coupons...");
  for (const c of COUPONS) {
    await db.coupon.create({
      data: {
        code: c.code,
        type: c.type,
        value: c.value,
        minAmount: c.minAmount,
        maxDiscount: c.maxDiscount,
        usageLimit: c.usageLimit,
        usedCount: 0,
        expiry: c.expiry,
        active: true,
      },
    });
  }

  console.log("🧾 Inserting sample orders for customer dashboard demo...");
  // Build orders using real product slugs
  const phantom = await db.product.findUnique({
    where: { slug: slugify("PhantomStrike Pro Panel") },
  });
  const nexus = await db.product.findUnique({
    where: { slug: slugify("Nexus Mod Menu v4") },
  });
  const apex = await db.product.findUnique({
    where: { slug: slugify("Apex Config Pack") },
  });
  const lunar = await db.product.findUnique({
    where: { slug: slugify("LunarAim Premium File") },
  });
  const eclipse = await db.product.findUnique({
    where: { slug: slugify("Eclipse Panel Elite") },
  });

  const sampleOrders: Array<{
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    total: number;
    status: string;
    paymentId: string | null;
    couponCode: string | null;
    discount: number;
    createdAt: Date;
    items: Array<{ product: NonNullable<typeof phantom>; qty: number }>;
  }> = [
    {
      orderNumber: "SV-2025-10042",
      customerName: "Demo Gamer",
      customerEmail: "demo@shadowvault.in",
      total: 2499,
      status: "PAID",
      paymentId: "pay_NxRazorpayDemo42",
      couponCode: null,
      discount: 0,
      createdAt: new Date("2025-04-12"),
      items: [{ product: phantom!, qty: 1 }],
    },
    {
      orderNumber: "SV-2025-10067",
      customerName: "Demo Gamer",
      customerEmail: "demo@shadowvault.in",
      total: 1598,
      status: "PAID",
      paymentId: "pay_NxRazorpayDemo67",
      couponCode: "WELCOME10",
      discount: 130,
      createdAt: new Date("2025-05-03"),
      items: [
        { product: apex!, qty: 1 },
        { product: nexus!, qty: 1 },
      ],
    },
    {
      orderNumber: "SV-2025-10089",
      customerName: "Demo Gamer",
      customerEmail: "demo@shadowvault.in",
      total: 4999,
      status: "PENDING",
      paymentId: null,
      couponCode: null,
      discount: 0,
      createdAt: new Date("2025-05-18"),
      items: [{ product: lunar!, qty: 1 }],
    },
    {
      orderNumber: "SV-2025-10103",
      customerName: "Demo Gamer",
      customerEmail: "demo@shadowvault.in",
      total: 3499,
      status: "REFUNDED",
      paymentId: "pay_NxRazorpayDemo103",
      couponCode: "SHADOW20",
      discount: 800,
      createdAt: new Date("2025-05-25"),
      items: [{ product: eclipse!, qty: 1 }],
    },
  ];

  for (const o of sampleOrders) {
    const itemsSnapshot = o.items.map((it) => ({
      productId: it.product.id,
      name: it.product.name,
      price: it.product.price,
      version: it.product.version,
      thumbnail: it.product.thumbnail,
      qty: it.qty,
    }));
    const created = await db.order.create({
      data: {
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        total: o.total,
        status: o.status,
        paymentId: o.paymentId,
        paymentMethod: "RAZORPAY",
        itemsJson: JSON.stringify(itemsSnapshot),
        couponCode: o.couponCode,
        discount: o.discount,
        createdAt: o.createdAt,
      },
    });
    for (const it of o.items) {
      await db.orderItem.create({
        data: {
          orderId: created.id,
          productId: it.product.id,
          name: it.product.name,
          price: it.product.price,
          version: it.product.version,
          thumbnail: it.product.thumbnail,
        },
      });
    }
  }

  console.log("✅ Seed complete!");
  console.log(
    `   Categories: ${CATEGORIES.length} | Products: ${PRODUCTS.length} | Reviews: ${reviews.length} | Coupons: ${COUPONS.length} | Orders: ${sampleOrders.length}`
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
