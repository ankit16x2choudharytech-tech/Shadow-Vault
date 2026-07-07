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

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

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
    } = body;

    if (!name || !tagline || !description || price == null) {
      return Response.json(
        { error: "Missing required fields: name, tagline, description, price" },
        { status: 400 }
      );
    }

    const slug = slugify(name);
    const created = await db.product.create({
      data: {
        name,
        slug,
        tagline,
        description,
        thumbnail: thumbnail || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
        banner: banner || thumbnail || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",
        version: version || "1.0.0",
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        category: category || "game-panels",
        type: type || "Panel",
        compatibility: compatibility || "Windows 10/11",
        fileSize: fileSize || "—",
        releaseDate: new Date(),
        telegramFileId: telegramFileId || `BAAC${Math.random().toString(36).slice(2, 20)}`,
        status: "ACTIVE",
        rating: 0,
        sales: 0,
        views: 0,
        features: JSON.stringify(features ?? []),
        screenshots: JSON.stringify(screenshots ?? []),
        whatsNew: JSON.stringify(whatsNew ?? ["Initial release"]),
        requirements: JSON.stringify(requirements ?? []),
        badge: badge ?? null,
      },
    });

    return Response.json(
      { data: transformProduct(created), message: "Product created successfully" },
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
