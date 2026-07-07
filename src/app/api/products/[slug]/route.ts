import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/api";
import type { Product } from "@/lib/types";

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const raw = await db.product.findUnique({
      where: { slug },
      include: {
        reviews: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!raw) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    // Increment views (fire-and-forget, non-blocking for response)
    db.product
      .update({ where: { id: raw.id }, data: { views: { increment: 1 } } })
      .catch(() => {});

    const product = transformProduct(raw);
    return Response.json({ data: product });
  } catch (err) {
    console.error("[GET /api/products/[slug]] error:", err);
    return Response.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
