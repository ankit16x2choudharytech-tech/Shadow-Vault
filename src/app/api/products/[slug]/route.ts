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

/** PATCH /api/products/[slug] — edit a product (param can be id or slug) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    // look up by id first, then by slug
    let product = await db.product.findUnique({ where: { id: slug } });
    if (!product) {
      product = await db.product.findUnique({ where: { slug } });
    }
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const {
      name, tagline, description, price, originalPrice, category, type,
      compatibility, fileSize, version, thumbnail, badge, status, features,
      telegramFileId,
    } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (tagline !== undefined) data.tagline = tagline;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = Number(price);
    if (originalPrice !== undefined) data.originalPrice = originalPrice ? Number(originalPrice) : null;
    if (category !== undefined) data.category = category;
    if (type !== undefined) data.type = type;
    if (compatibility !== undefined) data.compatibility = compatibility;
    if (fileSize !== undefined) data.fileSize = fileSize;
    if (version !== undefined) data.version = version;
    if (thumbnail !== undefined) data.thumbnail = thumbnail;
    if (badge !== undefined) data.badge = badge ?? null;
    if (status !== undefined) data.status = status;
    if (telegramFileId !== undefined) data.telegramFileId = telegramFileId;
    if (features !== undefined) data.features = JSON.stringify(features);

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await db.product.update({ where: { id: product.id }, data });
    return Response.json({ data: transformProduct(updated) });
  } catch (err) {
    console.error("[PATCH /api/products/[slug]] error:", err);
    return Response.json({ error: "Failed to update product" }, { status: 500 });
  }
}

/** DELETE /api/products/[slug] — delete a product (param can be id or slug) */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    // look up by id first, then by slug
    let product = await db.product.findUnique({ where: { id: slug } });
    if (!product) {
      product = await db.product.findUnique({ where: { slug } });
    }
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }
    await db.product.delete({ where: { id: product.id } });
    return Response.json({ message: "Product deleted" });
  } catch (err) {
    console.error("[DELETE /api/products/[slug]] error:", err);
    return Response.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
