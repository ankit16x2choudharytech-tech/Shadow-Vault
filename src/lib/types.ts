// ShadowVault - Shared TypeScript types
// These mirror the Prisma models but with JSON-string fields parsed into arrays.

export type CategoryColor =
  | "violet"
  | "emerald"
  | "amber"
  | "pink"
  | "cyan"
  | "fuchsia"
  | "rose";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string; // lucide icon name
  description?: string | null;
  color: string; // accent color token or hex
  createdAt: string;
}

export type ProductType =
  | "Panel"
  | "Mod Menu"
  | "Emulator Tool"
  | "Config"
  | "Premium File";

export type ProductBadge = "HOT" | "NEW" | "TRENDING" | "DEAL" | null;

export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export interface Product {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  thumbnail: string;
  banner: string;
  version: string;
  price: number; // INR rupees
  originalPrice?: number | null;
  category: string; // category slug
  type: ProductType | string;
  compatibility: string;
  fileSize: string;
  releaseDate: string;
  telegramFileId: string;
  status: ProductStatus | string;
  rating: number;
  sales: number;
  views: number;
  features: string[];
  screenshots: string[];
  whatsNew: string[];
  requirements: string[];
  badge: ProductBadge;
  createdAt: string;
  updatedAt: string;
  reviews?: Review[];
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userAvatar?: string | null;
  rating: number; // 1-5
  comment: string;
  verified: boolean;
  likes: number;
  date: string;
}

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  price: number;
  version: string;
  thumbnail: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: OrderStatus | string;
  paymentId?: string | null;
  paymentMethod: string;
  itemsJson: string;
  couponCode?: string | null;
  discount: number;
  createdAt: string;
  items?: OrderItem[];
}

export type CouponType = "PERCENT" | "FLAT";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType | string;
  value: number;
  minAmount: number;
  maxDiscount?: number | null;
  usageLimit: number;
  usedCount: number;
  expiry: string;
  active: boolean;
  createdAt: string;
}

// Cart item (frontend-only, not persisted in DB)
export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  thumbnail: string;
  version: string;
  type: string;
  quantity: number;
}

// API response helpers
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  discount?: number;
  coupon?: Coupon;
  message?: string;
}
