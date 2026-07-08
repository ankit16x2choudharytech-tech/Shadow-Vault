import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/api";
import type { Product } from "@/lib/types";

/**
 * Transform a raw Prisma product (with JSON-string fields) into a typed
 * Product with arrays parsed. Mirrors the transformProduct in
 * src/app/api/products/route.ts so PUT responses use the same shape.
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

/**
 * Resolve a product by id OR slug. The dynamic segment accepts either form
 * (frontend currently calls /api/products/<slug> for GET and
 * /api/products/<id> for PATCH/DELETE).
 */
async function findProductByIdOrSlug(value: string) {
  let product = await db.product.findUnique({ where: { id: value } });
  if (!product) {
    product = await db.product.findUnique({ where: { slug: value } });
  }
  return product;
}

/**
 * GET /api/products/[id] — fetch a single product (by id or slug), include
 * its reviews, fire-and-forget increment view counter.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const raw = await db.product.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: { date: "desc" },
        },
      },
    });

    // Fallback to slug-based lookup when id doesn't match.
    if (!raw) {
      const bySlug = await db.product.findUnique({
        where: { slug: id },
        include: {
          reviews: {
            orderBy: { date: "desc" },
          },
        },
      });
      if (!bySlug) {
        return Response.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }
      // Increment views (fire-and-forget)
      db.product
        .update({ where: { id: bySlug.id }, data: { views: { increment: 1 } } })
        .catch(() => {});
      return Response.json({ data: transformProduct(bySlug) });
    }

    // Increment views (fire-and-forget, non-blocking for response)
    db.product
      .update({ where: { id: raw.id }, data: { views: { increment: 1 } } })
      .catch(() => {});

    return Response.json({ data: transformProduct(raw) });
  } catch (err) {
    console.error("[GET /api/products/[id]] error:", err);
    return Response.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products/[id] — update a product by id.
 * Body may contain any subset of the listed fields; only provided fields
 * are written. Returns the updated product (transformed with parseJsonArray
 * for JSON-array fields).
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return Response.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const {
      name,
      tagline,
      description,
      price,
      originalPrice,
      category,
      type,
      compatibility,
      fileSize,
      version,
      thumbnail,
      features,
      telegramFileId,
      badge,
      status,
    } = body as Record<string, any>;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name);
    if (tagline !== undefined) data.tagline = String(tagline);
    if (description !== undefined) data.description = String(description);
    if (price !== undefined) data.price = Number(price);
    if (originalPrice !== undefined) {
      data.originalPrice = originalPrice ? Number(originalPrice) : null;
    }
    if (category !== undefined) data.category = String(category);
    if (type !== undefined) data.type = String(type);
    if (compatibility !== undefined) data.compatibility = String(compatibility);
    if (fileSize !== undefined) data.fileSize = String(fileSize);
    if (version !== undefined) data.version = String(version);
    if (thumbnail !== undefined) data.thumbnail = String(thumbnail);
    if (features !== undefined) {
      data.features = JSON.stringify(
        Array.isArray(features) ? features : []
      );
    }
    if (telegramFileId !== undefined) data.telegramFileId = String(telegramFileId);
    if (badge !== undefined) data.badge = badge ? String(badge) : null;
    if (status !== undefined) data.status = String(status);

    if (Object.keys(data).length === 0) {
      return Response.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updated = await db.product.update({
      where: { id },
      data,
      include: { reviews: { orderBy: { date: "desc" } } },
    });

    return Response.json({ data: transformProduct(updated) });
  } catch (err) {
    console.error("[PUT /api/products/[id]] error:", err);
    return Response.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/products/[id] — backwards-compatible alias of PUT.
 * The frontend admin edit form currently uses PATCH against /api/products/<id>;
 * keep it working alongside the new PUT handler.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Resolve by id first, then by slug (caller may pass either).
    let product = await db.product.findUnique({ where: { id } });
    if (!product) {
      product = await db.product.findUnique({ where: { slug: id } });
    }
    if (!product) {
      return Response.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const {
      name, tagline, description, price, originalPrice, category, type,
      compatibility, fileSize, version, thumbnail, badge, status, features,
      telegramFileId,
    } = body as Record<string, any>;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name);
    if (tagline !== undefined) data.tagline = String(tagline);
    if (description !== undefined) data.description = String(description);
    if (price !== undefined) data.price = Number(price);
    if (originalPrice !== undefined) {
      data.originalPrice = originalPrice ? Number(originalPrice) : null;
    }
    if (category !== undefined) data.category = String(category);
    if (type !== undefined) data.type = String(type);
    if (compatibility !== undefined) data.compatibility = String(compatibility);
    if (fileSize !== undefined) data.fileSize = String(fileSize);
    if (version !== undefined) data.version = String(version);
    if (thumbnail !== undefined) data.thumbnail = String(thumbnail);
    if (badge !== undefined) data.badge = badge ? String(badge) : null;
    if (status !== undefined) data.status = String(status);
    if (telegramFileId !== undefined) data.telegramFileId = String(telegramFileId);
    if (features !== undefined) {
      data.features = JSON.stringify(Array.isArray(features) ? features : []);
    }

    if (Object.keys(data).length === 0) {
      return Response.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updated = await db.product.update({
      where: { id: product.id },
      data,
      include: { reviews: { orderBy: { date: "desc" } } },
    });
    return Response.json({ data: transformProduct(updated) });
  } catch (err) {
    console.error("[PATCH /api/products/[id]] error:", err);
    return Response.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id] — delete a product by id.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verify existence first so we can return a clean 404.
    const existing = await findProductByIdOrSlug(id);
    if (!existing) {
      return Response.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    await db.product.delete({ where: { id: existing.id } });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/products/[id]] error:", err);
    return Response.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
