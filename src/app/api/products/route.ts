import { NextRequest } from "next/server";
import { db } from "@/lib/firebase";
import { transformProduct } from "@/lib/firestore-helpers";

/**
 * GET /api/products
 *
 * List products. Query params:
 *   ?category=<slug>    filter by category slug
 *   ?type=<type>        filter by product type
 *   ?q=<search>         search name/tagline/description (JS-side, dataset is small)
 *   ?sort=<popular|newest|price-low|price-high|rating>
 *   ?limit=<n>
 *
 * Always filters `status == "ACTIVE"`. Sorting is done in JS to avoid
 * Firestore composite-index requirements (dataset is small).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const q = searchParams.get("q");
    const sort = searchParams.get("sort");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : null;

    // Build equality-only where chain — no composite indexes required.
    let query: any = db
      .collection("products")
      .where("status", "==", "ACTIVE");
    if (category) query = query.where("category", "==", category);
    if (type) query = query.where("type", "==", type);

    const snapshot = await query.get();
    let products = snapshot.docs.map(transformProduct);

    // Search filter in JS (dataset is small).
    if (q) {
      const needle = q.toLowerCase();
      products = products.filter(
        (p: any) =>
          (p.name ?? "").toLowerCase().includes(needle) ||
          (p.tagline ?? "").toLowerCase().includes(needle) ||
          (p.description ?? "").toLowerCase().includes(needle)
      );
    }

    // Sort in JS (avoids Firestore composite-index requirements for
    // equality-where + orderBy-on-different-field).
    switch (sort) {
      case "popular":
        products.sort((a: any, b: any) => (b.sales ?? 0) - (a.sales ?? 0));
        break;
      case "newest":
        products.sort((a: any, b: any) =>
          String(b.releaseDate ?? "").localeCompare(String(a.releaseDate ?? ""))
        );
        break;
      case "price-low":
        products.sort((a: any, b: any) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "price-high":
        products.sort((a: any, b: any) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "rating":
        products.sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      default:
        // Default: newest by createdAt.
        products.sort((a: any, b: any) =>
          String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))
        );
        break;
    }

    if (limit && !Number.isNaN(limit)) {
      products = products.slice(0, limit);
    }

    return Response.json({ data: products });
  } catch (err) {
    console.error("[GET /api/products] error:", err);
    return Response.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * POST /api/products
 *
 * Create a product. Body fields map 1:1 to the product document.
 * `features`/`screenshots`/`whatsNew`/`requirements` arrive as native arrays
 * and are stored as native Firestore arrays (no JSON encoding).
 *
 * Slug is derived from `name`. If a product with that slug already exists, a
 * short random suffix is appended to keep slugs unique.
 *
 * Defaults: releaseDate=now, rating=0, sales=0, views=0, status="ACTIVE",
 * createdAt/updatedAt=now.
 *
 * Returns `{ data: product, message }` with status 201.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      tagline,
      description,
      thumbnail,
      banner,
      version,
      price,
      originalPrice,
      category,
      type,
      compatibility,
      fileSize,
      telegramFileId,
      features,
      screenshots,
      whatsNew,
      requirements,
      badge,
    } = body ?? {};

    if (!name || !tagline || !description || price == null) {
      return Response.json(
        {
          error: "Missing required fields: name, tagline, description, price",
        },
        { status: 400 }
      );
    }

    let slug = slugify(String(name));
    // Slug uniqueness — append a random suffix if the slug is taken.
    const existingSnap = await db
      .collection("products")
      .where("slug", "==", slug)
      .limit(1)
      .get();
    if (!existingSnap.empty) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 8)}`;
    }

    const now = new Date();
    const productData = {
      name: String(name),
      slug,
      tagline: String(tagline),
      description: String(description),
      thumbnail:
        thumbnail ||
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
      banner:
        banner ||
        thumbnail ||
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",
      version: version || "1.0.0",
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      category: category || "game-panels",
      type: type || "Panel",
      compatibility: compatibility || "Windows 10/11",
      fileSize: fileSize || "—",
      releaseDate: now,
      telegramFileId:
        telegramFileId || `BAAC${Math.random().toString(36).slice(2, 20)}`,
      status: "ACTIVE",
      rating: 0,
      sales: 0,
      views: 0,
      features: Array.isArray(features) ? features.map(String) : [],
      screenshots: Array.isArray(screenshots) ? screenshots.map(String) : [],
      whatsNew: Array.isArray(whatsNew)
        ? whatsNew.map(String)
        : ["Initial release"],
      requirements: Array.isArray(requirements)
        ? requirements.map(String)
        : [],
      badge: badge ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await db.collection("products").add(productData);
    const snap = await ref.get();

    return Response.json(
      {
        data: transformProduct(snap),
        message: "Product created successfully",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/products] error:", err);
    return Response.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
