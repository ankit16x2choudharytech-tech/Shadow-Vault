import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/api";
import type { Product } from "@/lib/types";

/**
 * Transform a raw Prisma product (with JSON-string fields) into a typed Product
 * with arrays parsed.
 */
function transformProduct(raw: any): Product {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    tagline: raw.tagline,
    description: raw.description,
    thumbnail: raw.thumbnail,
    banner: raw.banner,
    version: raw.version,
    price: raw.price,
    originalPrice: raw.originalPrice ?? null,
    category: raw.category,
    type: raw.type,
    compatibility: raw.compatibility,
    fileSize: raw.fileSize,
    releaseDate: raw.releaseDate?.toISOString?.() ?? raw.releaseDate,
    telegramFileId: raw.telegramFileId,
    status: raw.status,
    rating: raw.rating,
    sales: raw.sales,
    views: raw.views,
    features: parseJsonArray(raw.features),
    screenshots: parseJsonArray(raw.screenshots),
    whatsNew: parseJsonArray(raw.whatsNew),
    requirements: parseJsonArray(raw.requirements),
    badge: raw.badge ?? null,
    createdAt: raw.createdAt?.toISOString?.() ?? raw.createdAt,
    updatedAt: raw.updatedAt?.toISOString?.() ?? raw.updatedAt,
    reviews: raw.reviews?.map((r: any) => ({
      id: r.id,
      productId: r.productId,
      userName: r.userName,
      userAvatar: r.userAvatar ?? null,
      rating: r.rating,
      comment: r.comment,
      verified: r.verified,
      likes: r.likes,
      date: r.date?.toISOString?.() ?? r.date,
    })),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const q = searchParams.get("q");
    const sort = searchParams.get("sort"); // popular | newest | price-low | price-high | rating
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const where: any = { status: "ACTIVE" };
    if (category) where.category = category;
    if (type) where.type = type;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { tagline: { contains: q } },
        { description: { contains: q } },
      ];
    }

    let orderBy: any = { createdAt: "desc" };
    switch (sort) {
      case "popular":
        orderBy = { sales: "desc" };
        break;
      case "newest":
        orderBy = { releaseDate: "desc" };
        break;
      case "price-low":
        orderBy = { price: "asc" };
        break;
      case "price-high":
        orderBy = { price: "desc" };
        break;
      case "rating":
        orderBy = { rating: "desc" };
        break;
    }

    const rawProducts = await db.product.findMany({
      where,
      orderBy,
      ...(limit && !Number.isNaN(limit) ? { take: limit } : {}),
    });

    const products = rawProducts.map(transformProduct);
    return Response.json({ data: products });
  } catch (err) {
    console.error("[GET /api/products] error:", err);
    return Response.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
