/**
 * ShadowVault — Firestore seed script
 *
 * Populates Firestore with categories, products (with reviews), coupons,
 * users (bcrypt-hashed passwords), and sample orders.
 *
 * Run with:  bun prisma/seed-firestore.ts
 *
 * Requires FIREBASE_* env vars to be set in .env.
 */
import admin from "firebase-admin";
import bcrypt from "bcryptjs";

// ── Initialize Firebase from env ────────────────────────────────────────────
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKeyRaw) {
  console.error(
    "❌ Firebase env vars missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env"
  );
  process.exit(1);
}
if (
  !privateKeyRaw.includes("BEGIN PRIVATE KEY") ||
  privateKeyRaw.includes("REPLACE_WITH_YOUR_KEY")
) {
  console.error(
    "❌ FIREBASE_PRIVATE_KEY is still a placeholder. Add your real Firebase service account private key."
  );
  process.exit(1);
}

const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}
const db = admin.firestore();
db.settings({ preferRest: true });

// ── Data ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: "Game Panels", slug: "game-panels", icon: "LayoutDashboard", description: "High-performance overlay panels for competitive domination.", color: "violet" },
  { name: "Private Tools", slug: "private-tools", icon: "Wrench", description: "Exclusive private cheat & utility builds, invite-only tier.", color: "emerald" },
  { name: "Configs", slug: "configs", icon: "Settings2", description: "Tuned config packs that squeeze every drop of performance.", color: "amber" },
  { name: "Scripts", slug: "scripts", icon: "Code2", description: "Automation & macro scripts to streamline your grind.", color: "pink" },
  { name: "Utilities", slug: "utilities", icon: "Plug", description: "Emulators, boosters and system utilities that just work.", color: "cyan" },
  { name: "Premium Files", slug: "premium-files", icon: "Crown", description: "Flagship premium files for elite operators only.", color: "fuchsia" },
  { name: "Subscriptions", slug: "subscriptions", icon: "CreditCard", description: "Recurring access tiers with daily updates and priority support.", color: "rose" },
];

const PRODUCTS = [
  {
    name: "PhantomStrike Pro Panel", tagline: "Undetectable ESP + Aimbot overlay tuned for ranked chaos.",
    description: "PhantomStrike Pro is the most refined competitive overlay panel in the ShadowVault arsenal. Built with a low-footprint renderer, it layers real-time ESP, smooth aimbot targeting, and radar over any fullscreen game without triggering anti-cheat heuristics. Includes config profiles for 40+ popular titles.",
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",
    version: "4.2.1", price: 4999, originalPrice: 7999, category: "game-panels", type: "Panel",
    compatibility: "Windows 10/11", fileSize: "32.4 MB", badge: "HOT",
    features: ["Real-time ESP with player skeletons", "Smooth aimbot with humanized curves", "Radar minimap overlay", "40+ game config profiles", "Stream-proof rendering", "Configurable hotkeys"],
    screenshots: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80","https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80","https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80"],
    whatsNew: ["New config profile for Valorant", "Improved aimbot smoothness algorithm", "Fixed crash on Windows 11 24H2", "Added Korean language support"],
    requirements: ["Windows 10/11 64-bit","8GB RAM","DirectX 11 compatible GPU","Admin rights for overlay injection"],
    rating: 4.9, sales: 8420, views: 42000,
  },
  {
    name: "Nexus Mod Menu v4", tagline: "500+ injectable mods with one-click toggles.",
    description: "Nexus Mod Menu v4 is the most comprehensive single-player mod menu ever built. Inject 500+ gameplay, visual, and quality-of-life mods into your favourite titles with one click. Save and share mod presets. Compatible with Steam, Epic, and GOG versions.",
    thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80",
    version: "4.0.3", price: 2499, originalPrice: 3999, category: "private-tools", type: "Mod Menu",
    compatibility: "Windows 10/11, Android 12+", fileSize: "18.7 MB", badge: "TRENDING",
    features: ["500+ injectable mods", "One-click toggle system", "Mod preset save/share", "Cross-platform support", "Auto-update manager", "Conflict resolver"],
    screenshots: ["https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80","https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1200&q=80","https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200&q=80"],
    whatsNew: ["Added 24 new mods this month", "New preset sharing community hub", "Fixed Android 14 compatibility", "Performance optimization for large mod lists"],
    requirements: ["Windows 10/11 or Android 12+","4GB RAM","50MB free disk space","Internet for mod downloads"],
    rating: 4.5, sales: 5210, views: 28000,
  },
  {
    name: "Vortex Emulator Suite", tagline: "Run any mobile game on PC with 120fps.",
    description: "Vortex Emulator Suite is a premium Android emulator engineered specifically for gaming. Achieve 120fps on mid-range hardware with its custom kernel, GPU passthrough, and per-game optimization profiles. Includes macro recording and multi-instance management.",
    thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&q=80",
    version: "6.2.0", price: 1999, originalPrice: 2999, category: "utilities", type: "Emulator Tool",
    compatibility: "Windows 10/11", fileSize: "412 MB", badge: "NEW",
    features: ["120fps gaming on mid-range hardware", "Custom Android gaming kernel", "Per-game optimization profiles", "Macro recording & playback", "Multi-instance manager", "Controller mapping"],
    screenshots: ["https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&q=80","https://images.unsplash.com/photo-1598842057894-37bbff5f02b5?w=1200&q=80","https://images.unsplash.com/photo-1605379399642-870262d3d051?w=1200&q=80"],
    whatsNew: ["Android 14 kernel support", "New macro recording UI", "Fixed GPU passthrough on NVIDIA 40-series", "Reduced idle RAM usage by 30%"],
    requirements: ["Windows 10/11 64-bit","16GB RAM recommended","VT-x/AMD-V enabled in BIOS","20GB free disk space"],
    rating: 4.7, sales: 3180, views: 19000,
  },
  {
    name: "Apex Config Pack", tagline: "Pro-tier FPS configs handcrafted by ex-pro players.",
    description: "The Apex Config Pack is a curated collection of competitive FPS configurations created by former esports professionals. Optimized sensitivity curves, crosshair settings, FOV tuning, and audio mixing for 12 popular shooters. Instantly feel the difference.",
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&q=80",
    version: "3.1.0", price: 799, originalPrice: 1299, category: "configs", type: "Config",
    compatibility: "Windows 10/11", fileSize: "4.2 MB", badge: "DEAL",
    features: ["12 popular FPS configs", "Pro-player sensitivity curves", "Optimized crosshair settings", "Audio mix presets", "FOV & viewmodel tuning", "Auto-apply per game"],
    screenshots: ["https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&q=80","https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=1200&q=80"],
    whatsNew: ["Added The Finals config", "Updated sensitivity for CS2", "New audio preset: Tournament Focus"],
    requirements: ["Windows 10/11","Target games installed","5MB free disk space"],
    rating: 4.6, sales: 6780, views: 31000,
  },
  {
    name: "ShadowBot Automation Script", tagline: "Automate the grind — farming, crafting, dailies.",
    description: "ShadowBot is a powerful automation script engine for MMORPGs and live-service games. Schedule daily quests, automate farming routes, craft in bulk, and manage multiple accounts. Humanized input patterns keep you safe.",
    thumbnail: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80",
    version: "2.5.0", price: 1299, originalPrice: 1999, category: "scripts", type: "Config",
    compatibility: "Windows 10/11", fileSize: "12.1 MB", badge: null,
    features: ["Visual script builder", "Humanized input patterns", "Multi-account manager", "Schedule-based automation", "Farming route optimizer", "Discord webhook alerts"],
    screenshots: ["https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80","https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1200&q=80"],
    whatsNew: ["New visual script builder", "Added Genshin Impact farming routes", "Improved detection avoidance"],
    requirements: ["Windows 10/11","8GB RAM","Target game installed",".NET 6 runtime"],
    rating: 4.4, sales: 2140, views: 15000,
  },
  {
    name: "Titanium Overlay Engine", tagline: "Build your own overlays with zero coding.",
    description: "Titanium Overlay Engine is a no-code overlay creation suite. Design custom HUDs, performance monitors, and game overlays with a drag-and-drop editor. Export to any game with one click. Includes 50+ prebuilt templates.",
    thumbnail: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200&q=80",
    version: "5.0.0", price: 3499, originalPrice: 4999, category: "game-panels", type: "Panel",
    compatibility: "Windows 10/11", fileSize: "56.3 MB", badge: "HOT",
    features: ["Drag-and-drop overlay editor", "50+ prebuilt templates", "Export to any game", "Performance monitor widgets", "Custom Lua scripting", "Community template marketplace"],
    screenshots: ["https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200&q=80","https://images.unsplash.com/photo-1605379399642-870262d3d051?w=1200&q=80"],
    whatsNew: ["New Lua scripting engine", "20 new community templates", "Fixed multi-monitor rendering"],
    requirements: ["Windows 10/11 64-bit","8GB RAM","DirectX 11 GPU","100MB free disk space"],
    rating: 4.8, sales: 4520, views: 24000,
  },
  {
    name: "LunarAim Premium File", tagline: "The aim trainer used by top-ranked pros.",
    description: "LunarAim is a premium aim training program with adaptive difficulty, weak-spot detection, and a progression system that mirrors real ranked play. Used by top-500 players globally. Includes 200+ training scenarios.",
    thumbnail: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1200&q=80",
    version: "7.1.0", price: 2999, originalPrice: 4499, category: "premium-files", type: "Premium File",
    compatibility: "Windows 10/11", fileSize: "89.5 MB", badge: null,
    features: ["Adaptive difficulty AI", "Weak-spot detection", "200+ training scenarios", "Ranked progression system", "Detailed performance analytics", "Pro player benchmark comparisons"],
    screenshots: ["https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1200&q=80","https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=1200&q=80"],
    whatsNew: ["New tracking scenarios", "Improved analytics dashboard", "Added crosshair generator"],
    requirements: ["Windows 10/11","8GB RAM","Gaming mouse recommended"],
    rating: 4.9, sales: 2980, views: 17000,
  },
  {
    name: "Cipher Streamer Kit", tagline: "Everything a streamer needs — overlays, alerts, bots.",
    description: "Cipher Streamer Kit is an all-in-one streaming enhancement suite. Animated overlays, follower alerts, chat bots, donation integration, and scene manager — all in one lightweight app. Compatible with OBS and Streamlabs.",
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&q=80",
    version: "2.0.0", price: 1799, originalPrice: 2799, category: "subscriptions", type: "Premium File",
    compatibility: "Windows 10/11, macOS 12+", fileSize: "145 MB", badge: "NEW",
    features: ["Animated overlay packs", "Follower/sub alerts", "Chat moderation bot", "Donation integration", "Scene manager", "OBS & Streamlabs compatible"],
    screenshots: ["https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&q=80","https://images.unsplash.com/photo-1605379399642-870262d3d051?w=1200&q=80"],
    whatsNew: ["New animated overlay pack: Neon Pulse", "Discord integration", "Fixed macOS Sonoma crash"],
    requirements: ["Windows 10/11 or macOS 12+","8GB RAM","OBS or Streamlabs installed"],
    rating: 4.6, sales: 1640, views: 12000,
  },
  {
    name: "Wraith Performance Booster", tagline: "Squeeze every frame — system-level game optimization.",
    description: "Wraith Performance Booster is a system-level optimizer that suspends background processes, defragments game assets, and tunes GPU/CPU scheduling for maximum frames. Average 25-40% FPS improvement on tested titles.",
    thumbnail: "https://images.unsplash.com/photo-1605379399642-870262d3d051?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1605379399642-870262d3d051?w=1200&q=80",
    version: "3.3.0", price: 999, originalPrice: 1599, category: "utilities", type: "Emulator Tool",
    compatibility: "Windows 10/11", fileSize: "8.9 MB", badge: null,
    features: ["Background process suspension", "Game asset defragmentation", "GPU/CPU scheduler tuning", "Real-time FPS counter", "Per-game optimization profiles", "One-click game boost"],
    screenshots: ["https://images.unsplash.com/photo-1605379399642-870262d3d051?w=1200&q=80","https://images.unsplash.com/photo-1598842057894-37bbff5f02b5?w=1200&q=80"],
    whatsNew: ["New optimization profiles for 30 games", "Improved RAM cleanup", "Fixed notification spam bug"],
    requirements: ["Windows 10/11 64-bit","Admin rights"],
    rating: 4.5, sales: 5430, views: 26000,
  },
  {
    name: "Spectre Config Vault", tagline: "Lifetime access to a growing vault of 200+ configs.",
    description: "Spectre Config Vault is an ever-expanding library of 200+ hand-tuned configurations for competitive games, productivity apps, and developer tools. New configs added weekly. One purchase = lifetime access.",
    thumbnail: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=1200&q=80",
    version: "1.8.0", price: 1499, originalPrice: 2499, category: "configs", type: "Config",
    compatibility: "Cross-platform", fileSize: "2.1 MB", badge: "DEAL",
    features: ["200+ hand-tuned configs", "Weekly new additions", "Cross-platform support", "Auto-detect installed apps", "One-click apply", "Config version history"],
    screenshots: ["https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=1200&q=80"],
    whatsNew: ["Added 15 new configs this week", "New auto-detect engine", "Config rollback feature"],
    requirements: ["Any OS","Target apps installed"],
    rating: 4.5, sales: 3890, views: 21000,
  },
  {
    name: "Eclipse Panel Elite", tagline: "The flagship panel — everything, undetectable.",
    description: "Eclipse Panel Elite is the pinnacle of ShadowVault's panel lineup. Combining ESP, aimbot, radar, recoil control, and a scriptable macro engine into one ultra-low-footprint package. Built for the most demanding ranked players.",
    thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80",
    version: "9.0.0", price: 5999, originalPrice: 8999, category: "game-panels", type: "Panel",
    compatibility: "Windows 10/11", fileSize: "48.7 MB", badge: "TRENDING",
    features: ["Full ESP suite", "Humanized aimbot", "Recoil control system", "Scriptable macro engine", "Radar overlay", "Config cloud sync"],
    screenshots: ["https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80","https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80"],
    whatsNew: ["New macro scripting docs", "Improved anti-cheat evasion", "Cloud sync beta"],
    requirements: ["Windows 10/11 64-bit","16GB RAM","DirectX 12 GPU","Admin rights"],
    rating: 4.9, sales: 1870, views: 14000,
  },
  {
    name: "Nova Tournament Pack", tagline: "Tournament-ready configs + coaching material bundle.",
    description: "Nova Tournament Pack bundles competition-grade configs, aim training scenarios, and exclusive coaching material from championship winners. Everything you need to go from casual to tournament-ready.",
    thumbnail: "https://images.unsplash.com/photo-1598842057894-37bbff5f02b5?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1598842057894-37bbff5f02b5?w=1200&q=80",
    version: "2.2.0", price: 3499, originalPrice: 4999, category: "premium-files", type: "Premium File",
    compatibility: "Windows 10/11", fileSize: "320 MB", badge: null,
    features: ["Tournament-grade configs", "Aim training scenarios", "Championship coaching videos", "Strategy guides", "Pre-match warmup routines", "Pro player demo reviews"],
    screenshots: ["https://images.unsplash.com/photo-1598842057894-37bbff5f02b5?w=1200&q=80","https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1200&q=80"],
    whatsNew: ["New coaching module: Mid-round calls", "Updated configs for current patch", "Added 5 new scenarios"],
    requirements: ["Windows 10/11","Target games installed","500MB free disk space"],
    rating: 4.7, sales: 920, views: 8000,
  },
];

const COUPONS = [
  { code: "WELCOME10", type: "PERCENT", value: 10, minAmount: 499, maxDiscount: 500, usageLimit: 1000, expiry: new Date("2026-12-31") },
  { code: "SHADOW20", type: "PERCENT", value: 20, minAmount: 1499, maxDiscount: 1000, usageLimit: 500, expiry: new Date("2026-06-30") },
  { code: "FLAT200", type: "FLAT", value: 200, minAmount: 999, maxDiscount: null, usageLimit: 300, expiry: new Date("2026-09-30") },
  { code: "GAMER500", type: "FLAT", value: 500, minAmount: 2999, maxDiscount: null, usageLimit: 200, expiry: new Date("2026-12-31") },
  { code: "FIRSTBUY", type: "PERCENT", value: 15, minAmount: 299, maxDiscount: 300, usageLimit: 2000, expiry: new Date("2027-01-31") },
];

const USERS = [
  { name: "Demo Gamer", email: "demo@shadowvault.in", password: "test1234", role: "customer", tier: "Premium", orders: 4, spent: 11594, banned: false },
  { name: "Vault Admin", email: "admin@shadowvault.in", password: "admin123", role: "admin", tier: "Premium", orders: 0, spent: 0, banned: false },
  { name: "Arjun Verma", email: "arjun@gmail.com", password: "pass1234", role: "customer", tier: "Premium", orders: 14, spent: 18999, banned: false },
  { name: "Riya Kapoor", email: "riya@gmail.com", password: "pass1234", role: "customer", tier: "Premium", orders: 9, spent: 12450, banned: false },
  { name: "Karthik Reddy", email: "karthik@gmail.com", password: "pass1234", role: "customer", tier: "Standard", orders: 4, spent: 3200, banned: false },
  { name: "Zaid Khan", email: "zaid@gmail.com", password: "pass1234", role: "customer", tier: "Premium", orders: 22, spent: 34700, banned: false },
  { name: "Suspicious User", email: "spam@temp.com", password: "pass1234", role: "customer", tier: "Standard", orders: 1, spent: 499, banned: true },
  { name: "Ananya Singh", email: "ananya@gmail.com", password: "pass1234", role: "customer", tier: "Standard", orders: 7, spent: 8990, banned: false },
];

const REVIEW_NAMES = ["ArjunVerma","RiyaPro","Karthik_GG","ZaidPlays","AnanyaGG","VikramClutch"];
const REVIEW_COMMENTS = [
  "Absolutely worth every rupee. Instant delivery and the panel works flawlessly.",
  "Best purchase I've made this year. The config pack alone improved my KD by 30%.",
  "Customer support helped me set it up at 2am. Top tier service.",
  "Been using for 3 months, zero issues. Updates are frequent and free.",
  "The aim trainer is incredible. Went from Gold to Diamond in 6 weeks.",
  "Premium quality. The overlay is so clean and the performance is great.",
  "Tournament pack gave me the edge I needed. Qualified for my first LAN!",
  "Worth it just for the configs. The coaching material is a bonus.",
];

// ── Seed ────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("🔥 ShadowVault Firestore Seeder\n");

  // Clear existing data (best-effort — delete in batches)
  console.log("🧹 Clearing existing collections...");
  for (const col of ["reviews", "products", "categories", "coupons", "orders", "users"]) {
    const snap = await db.collection(col).get();
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    if (snap.size > 0) await batch.commit();
    console.log(`   cleared ${snap.size} docs from ${col}`);
  }

  // 1. Categories
  console.log("\n📂 Inserting categories...");
  for (const c of CATEGORIES) {
    await db.collection("categories").add({ ...c, createdAt: new Date() });
  }
  console.log(`   ${CATEGORIES.length} categories inserted`);

  // 2. Products
  console.log("\n📦 Inserting products...");
  const productIds: string[] = [];
  for (const p of PRODUCTS) {
    const ref = await db.collection("products").add({
      ...p,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      releaseDate: new Date("2025-01-15"),
      telegramFileId: "/uploads/sample-readme.txt",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    productIds.push(ref.id);

    // 3 reviews per product (first 8 products)
    const idx = productIds.length - 1;
    if (idx < 8) {
      for (let r = 0; r < 3; r++) {
        await db.collection("reviews").add({
          productId: ref.id,
          userName: REVIEW_NAMES[(idx + r) % REVIEW_NAMES.length],
          userAvatar: null,
          rating: [5, 5, 4, 5, 4][r % 5],
          comment: REVIEW_COMMENTS[(idx + r) % REVIEW_COMMENTS.length],
          verified: r !== 2,
          likes: Math.floor(Math.random() * 80),
          date: new Date(Date.now() - r * 7 * 24 * 60 * 60 * 1000),
        });
      }
    }
  }
  console.log(`   ${PRODUCTS.length} products + reviews inserted`);

  // 3. Coupons
  console.log("\n🎟️  Inserting coupons...");
  for (const c of COUPONS) {
    await db.collection("coupons").add({
      ...c,
      usedCount: Math.floor(Math.random() * 200),
      active: true,
      createdAt: new Date(),
    });
  }
  console.log(`   ${COUPONS.length} coupons inserted`);

  // 4. Users (bcrypt-hashed passwords)
  console.log("\n👥 Inserting users...");
  const userIds: { id: string; email: string }[] = [];
  for (const u of USERS) {
    const hashed = bcrypt.hashSync(u.password, 10);
    const ref = await db.collection("users").add({
      name: u.name,
      email: u.email,
      password: hashed,
      role: u.role,
      tier: u.tier,
      orders: u.orders,
      spent: u.spent,
      banned: u.banned,
      createdAt: new Date(),
    });
    userIds.push({ id: ref.id, email: u.email });
  }
  console.log(`   ${USERS.length} users inserted`);

  // 5. Sample orders for demo customer
  console.log("\n🧾 Inserting sample orders...");
  const demoUser = userIds.find((u) => u.email === "demo@shadowvault.in");
  if (demoUser && productIds.length >= 3) {
    const sampleOrders = [
      { items: [productIds[0]], status: "PAID", total: 4999, discount: 0 },
      { items: [productIds[3]], status: "PAID", total: 799, discount: 0 },
      { items: [productIds[1]], status: "PENDING", total: 2499, discount: 0 },
      { items: [productIds[8]], status: "REFUNDED", total: 999, discount: 0 },
    ];
    for (let i = 0; i < sampleOrders.length; i++) {
      const o = sampleOrders[i];
      const items = await Promise.all(
        o.items.map(async (pid) => {
          const doc = await db.collection("products").doc(pid).get();
          const p = doc.data()!;
          return {
            productId: pid,
            name: p.name,
            price: p.price,
            version: p.version,
            thumbnail: p.thumbnail,
          };
        })
      );
      await db.collection("orders").add({
        orderNumber: `SV-2025-${10042 + i}`,
        customerName: "Demo Gamer",
        customerEmail: "demo@shadowvault.in",
        total: o.total,
        status: o.status,
        paymentId: o.status === "PAID" ? `pay_demo_${10042 + i}` : null,
        paymentMethod: "RAZORPAY",
        items,
        couponCode: null,
        discount: o.discount,
        createdAt: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000),
      });
    }
    console.log(`   ${sampleOrders.length} sample orders inserted`);
  }

  console.log("\n✅ Firestore seed complete!");
  console.log(`   Categories: ${CATEGORIES.length} | Products: ${PRODUCTS.length}`);
  console.log(`   Coupons: ${COUPONS.length} | Users: ${USERS.length}`);
  console.log("\n🔑 Login credentials:");
  console.log("   Customer: demo@shadowvault.in / test1234");
  console.log("   Admin:    admin@shadowvault.in / admin123 (code: VAULT-ADMIN-2025)");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
