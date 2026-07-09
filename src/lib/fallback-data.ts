import bcrypt from "bcryptjs";

export interface FallbackUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  banned: boolean;
  tier: string;
  orders: number;
  spent: number;
  createdAt: string;
}

const fallbackUsers = new Map<string, FallbackUser>();

const fallbackCategories = [
  {
    id: "fallback-category-game-panels",
    name: "Game Panels",
    slug: "game-panels",
    icon: "🎮",
    description: "Premium game enhancement panels",
    color: "from-purple-500 to-fuchsia-500",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-category-aim-assists",
    name: "Aim Assist",
    slug: "aim-assist",
    icon: "🎯",
    description: "Precision tools and overlays",
    color: "from-cyan-500 to-blue-500",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-category-utility",
    name: "Utility",
    slug: "utility",
    icon: "🛠️",
    description: "Productivity and utility packs",
    color: "from-emerald-500 to-green-500",
    createdAt: new Date().toISOString(),
  },
];

const fallbackProducts = [
  {
    id: "fallback-product-aim-booster-pro",
    name: "Aim Booster Pro",
    slug: "aim-booster-pro",
    tagline: "Sharper aim with instant response",
    description: "A polished, high-performance panel built for competitive players.",
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",
    version: "1.2.0",
    price: 499,
    originalPrice: 699,
    category: "game-panels",
    type: "Panel",
    compatibility: "Windows 10/11",
    fileSize: "24 MB",
    releaseDate: new Date().toISOString(),
    telegramFileId: "fallback-aim-booster-pro",
    status: "ACTIVE",
    rating: 4.8,
    sales: 128,
    views: 540,
    features: ["Fast aim tuning", "Low latency", "Custom themes"],
    screenshots: ["https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80"],
    whatsNew: ["Improved smoothing", "New presets"],
    requirements: ["Windows 10+", "DirectX 11"],
    badge: "Hot",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "fallback-product-speed-hack",
    name: "Speed Hack",
    slug: "speed-hack",
    tagline: "Smooth motion and better pacing",
    description: "A lightweight utility panel for faster reaction and movement tuning.",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
    version: "2.0.0",
    price: 299,
    originalPrice: 399,
    category: "utility",
    type: "Utility",
    compatibility: "Windows 10/11",
    fileSize: "12 MB",
    releaseDate: new Date().toISOString(),
    telegramFileId: "fallback-speed-hack",
    status: "ACTIVE",
    rating: 4.5,
    sales: 83,
    views: 320,
    features: ["Tunable motion", "Quick install", "Adaptive UI"],
    screenshots: ["https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80"],
    whatsNew: ["UI refresh", "Better defaults"],
    requirements: ["Windows 10+"],
    badge: "Popular",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function isFirestoreUnavailable(error: unknown): boolean {
  if (!error) return false;

  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : JSON.stringify(error);

  return /firestore|permission denied|accessNotConfigured|service disabled|403|unauthenticated/i.test(message);
}

export function getFallbackCategories() {
  return fallbackCategories.map((category) => ({ ...category }));
}

export function getFallbackProducts() {
  return fallbackProducts.map((product) => ({ ...product }));
}

export function getFallbackUserByEmail(email: string): FallbackUser | null {
  const normalized = email.trim().toLowerCase();
  for (const user of fallbackUsers.values()) {
    if (user.email === normalized) return user;
  }
  return null;
}

export function getFallbackUserById(id: string): FallbackUser | null {
  return fallbackUsers.get(id) ?? null;
}

export async function createFallbackUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<FallbackUser> {
  const id = `fallback-${Math.random().toString(36).slice(2, 10)}`;
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user: FallbackUser = {
    id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: passwordHash,
    role: "customer",
    banned: false,
    tier: "Standard",
    orders: 0,
    spent: 0,
    createdAt: new Date().toISOString(),
  };
  fallbackUsers.set(id, user);
  return user;
}
