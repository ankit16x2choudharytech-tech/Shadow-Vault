// ShadowVault - Firestore helpers
//
// Shared transforms for converting Firestore DocumentSnapshots into the typed
// shapes the frontend expects (Product, Category, Review). Arrays
// (features/screenshots/whatsNew/requirements) are stored NATIVELY in Firestore
// — no JSON string parsing needed. Dates are returned as ISO strings.
//
// Use like:
//   import { db } from "@/lib/firebase";
//   import { transformProduct } from "@/lib/firestore-helpers";
//   const snap = await db.collection("products").doc(id).get();
//   const product = transformProduct(snap);

import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { Product, Review, Category, Order, OrderItem, Coupon } from "@/lib/types";

/**
 * A Firestore DocumentSnapshot (covers both single-doc reads and query docs).
 * Using a structural alias keeps us independent of the exact SDK type
 * parameters and works equally for `db.collection(x).doc(id).get()` results
 * and `querySnapshot.docs[i]` entries.
 */
type DocSnapshot = DocumentSnapshot;

/**
 * Convert a Firestore Timestamp, Date, or ISO string into an ISO string.
 * Returns null for null/undefined/unrecognized inputs so callers can default.
 */
export function toISO(date: unknown): string | null {
  if (!date) return null;

  if (typeof date === "string") return date;

  if (date instanceof Date) return date.toISOString();

  // Firestore Timestamp duck-type — has toDate() and/or toMillis() and/or
  // { seconds, nanoseconds }.
  const t = date as {
    toDate?: () => Date;
    toMillis?: () => number;
    seconds?: number;
    nanoseconds?: number;
  };

  if (typeof t.toDate === "function") {
    try {
      return t.toDate().toISOString();
    } catch {
      return null;
    }
  }

  if (typeof t.toMillis === "function") {
    try {
      return new Date(t.toMillis()).toISOString();
    } catch {
      return null;
    }
  }

  if (typeof t.seconds === "number") {
    return new Date(t.seconds * 1000).toISOString();
  }

  return null;
}

/**
 * Transform a Firestore product DocumentSnapshot into the Product shape the
 * frontend expects. Arrays are kept as-is (Firestore stores them natively).
 * Dates become ISO strings. `id` is taken from the snapshot id (not a body
 * field) — Firestore auto-generated doc ids are used.
 */
export function transformProduct(doc: DocSnapshot): Product {
  const data = (doc.data() ?? {}) as Record<string, any>;

  return {
    id: doc.id,
    name: data.name ?? "",
    slug: data.slug ?? "",
    tagline: data.tagline ?? "",
    description: data.description ?? "",
    thumbnail: data.thumbnail ?? "",
    banner: data.banner ?? "",
    version: data.version ?? "1.0.0",
    price: typeof data.price === "number" ? data.price : Number(data.price ?? 0),
    originalPrice:
      data.originalPrice === undefined ? null : data.originalPrice ?? null,
    category: data.category ?? "",
    type: data.type ?? "Panel",
    compatibility: data.compatibility ?? "",
    fileSize: data.fileSize ?? "",
    releaseDate: toISO(data.releaseDate) ?? new Date().toISOString(),
    telegramFileId: data.telegramFileId ?? "",
    status: data.status ?? "ACTIVE",
    rating:
      typeof data.rating === "number" ? data.rating : Number(data.rating ?? 0),
    sales: typeof data.sales === "number" ? data.sales : Number(data.sales ?? 0),
    views: typeof data.views === "number" ? data.views : Number(data.views ?? 0),
    features: Array.isArray(data.features) ? data.features.map(String) : [],
    screenshots: Array.isArray(data.screenshots)
      ? data.screenshots.map(String)
      : [],
    whatsNew: Array.isArray(data.whatsNew) ? data.whatsNew.map(String) : [],
    requirements: Array.isArray(data.requirements)
      ? data.requirements.map(String)
      : [],
    badge: data.badge ?? null,
    createdAt: toISO(data.createdAt) ?? new Date().toISOString(),
    updatedAt: toISO(data.updatedAt) ?? new Date().toISOString(),
  };
}

/**
 * Transform a Firestore category DocumentSnapshot into the Category shape.
 */
export function transformCategory(doc: DocSnapshot): Category {
  const data = (doc.data() ?? {}) as Record<string, any>;
  return {
    id: doc.id,
    name: data.name ?? "",
    slug: data.slug ?? "",
    icon: data.icon ?? "",
    description: data.description ?? null,
    color: data.color ?? "",
    createdAt: toISO(data.createdAt) ?? new Date().toISOString(),
  };
}

/**
 * Transform a Firestore review DocumentSnapshot into the Review shape.
 */
export function transformReview(doc: DocSnapshot): Review {
  const data = (doc.data() ?? {}) as Record<string, any>;
  return {
    id: doc.id,
    productId: data.productId ?? "",
    userName: data.userName ?? "",
    userAvatar: data.userAvatar ?? null,
    rating:
      typeof data.rating === "number" ? data.rating : Number(data.rating ?? 0),
    comment: data.comment ?? "",
    verified: !!data.verified,
    likes: typeof data.likes === "number" ? data.likes : Number(data.likes ?? 0),
    date: toISO(data.date) ?? new Date().toISOString(),
  };
}

/**
 * Transform a Firestore order DocumentSnapshot into the Order shape the
 * frontend expects. Items are stored as a NATIVE array inside the order doc
 * (no separate `orderItems` collection). Each item is normalized to the
 * OrderItem shape — synthetic `id`/`orderId` fields are added so the frontend
 * (which uses `it.id` as a React key) keeps working without changes.
 *
 * `itemsJson` is kept as a JSON string of the items array for backward
 * compatibility with any legacy code that reads it.
 */
export function transformOrder(doc: DocSnapshot): Order {
  const data = (doc.data() ?? {}) as Record<string, any>;
  const orderId = doc.id;

  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items: OrderItem[] = rawItems.map((it: any, idx: number) => {
    const item = (it ?? {}) as Record<string, any>;
    return {
      id: typeof item.id === "string" && item.id ? item.id : `${orderId}-${idx}`,
      orderId,
      productId: item.productId ?? "",
      name: item.name ?? "",
      price:
        typeof item.price === "number" ? item.price : Number(item.price ?? 0),
      version: item.version ?? "",
      thumbnail: item.thumbnail ?? "",
    };
  });

  const itemsJson =
    typeof data.itemsJson === "string" && data.itemsJson.length > 0
      ? data.itemsJson
      : JSON.stringify(
          items.map((it) => ({
            productId: it.productId,
            name: it.name,
            price: it.price,
            version: it.version,
            thumbnail: it.thumbnail,
            qty: 1,
          }))
        );

  return {
    id: orderId,
    orderNumber: data.orderNumber ?? "",
    customerName: data.customerName ?? "",
    customerEmail: data.customerEmail ?? "",
    total: typeof data.total === "number" ? data.total : Number(data.total ?? 0),
    status: data.status ?? "PENDING",
    paymentId: data.paymentId ?? null,
    paymentMethod: data.paymentMethod ?? "",
    itemsJson,
    couponCode: data.couponCode ?? null,
    discount:
      typeof data.discount === "number"
        ? data.discount
        : Number(data.discount ?? 0),
    createdAt: toISO(data.createdAt) ?? new Date().toISOString(),
    items,
  };
}

/**
 * Transform a Firestore coupon DocumentSnapshot into the Coupon shape.
 */
export function transformCoupon(doc: DocSnapshot): Coupon {
  const data = (doc.data() ?? {}) as Record<string, any>;
  return {
    id: doc.id,
    code: data.code ?? "",
    type: data.type ?? "PERCENT",
    value: typeof data.value === "number" ? data.value : Number(data.value ?? 0),
    minAmount:
      typeof data.minAmount === "number"
        ? data.minAmount
        : Number(data.minAmount ?? 0),
    maxDiscount:
      data.maxDiscount === undefined || data.maxDiscount === null
        ? null
        : data.maxDiscount,
    usageLimit:
      typeof data.usageLimit === "number"
        ? data.usageLimit
        : Number(data.usageLimit ?? 0),
    usedCount:
      typeof data.usedCount === "number"
        ? data.usedCount
        : Number(data.usedCount ?? 0),
    expiry: toISO(data.expiry) ?? new Date().toISOString(),
    active: !!data.active,
    createdAt: toISO(data.createdAt) ?? new Date().toISOString(),
  };
}

/**
 * Transform a Firestore user DocumentSnapshot into the public User shape.
 * NEVER includes the `password` field.
 */
export function transformUser(doc: DocSnapshot) {
  const data = (doc.data() ?? {}) as Record<string, any>;
  return {
    id: doc.id,
    name: data.name ?? "",
    email: data.email ?? "",
    role: data.role ?? "customer",
    banned: !!data.banned,
    tier: data.tier ?? "Standard",
    orders:
      typeof data.orders === "number" ? data.orders : Number(data.orders ?? 0),
    spent: typeof data.spent === "number" ? data.spent : Number(data.spent ?? 0),
    createdAt: toISO(data.createdAt) ?? new Date().toISOString(),
  };
}
