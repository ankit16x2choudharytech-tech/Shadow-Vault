import { db } from "@/lib/firebase";
import { transformProduct, transformReview } from "@/lib/firestore-helpers";
import { FieldValue, type DocumentSnapshot } from "firebase-admin/firestore";

/**
 * Resolve a product DocumentSnapshot by id OR slug.
 *
 * The dynamic route segment accepts either form — the frontend calls
 * `/api/products/<slug>` for GET and `/api/products/<id>` for PATCH/DELETE,
 * so we look up by doc id first, then fall back to a slug query.
 */
async function findProductDoc(
  value: string
): Promise<DocumentSnapshot | null> {
  // 1. Try direct doc-id lookup (cheap).
  const byId = await db.collection("products").doc(value).get();
  if (byId.exists) return byId;

  // 2. Fallback: slug-based lookup.
  const bySlug = await db
    .collection("products")
    .where("slug", "==", value)
    .limit(1)
    .get();
  if (!bySlug.empty) return bySlug.docs[0];

  return null;
}

/**
 * Fetch reviews for a product, newest first. Falls back to fetching without
 * orderBy + sorting in JS if a composite index is missing.
 */
async function fetchReviews(productId: string) {
  try {
    const snap = await db
      .collection("reviews")
      .where("productId", "==", productId)
      .orderBy("date", "desc")
      .get();
    return snap.docs.map(transformReview);
  } catch (err) {
    // Fallback: equality-only query + JS sort by date desc.
    const snap = await db
      .collection("reviews")
      .where("productId", "==", productId)
      .get();
    const reviews = snap.docs.map(transformReview);
    reviews.sort((a, b) =>
      String(b.date ?? "").localeCompare(String(a.date ?? ""))
    );
    return reviews;
  }
}

/**
 * GET /api/products/[id] — fetch a single product (by id or slug), include its
 * reviews, fire-and-forget increment the view counter.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await findProductDoc(id);
    if (!doc) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    // Fire-and-forget view increment (atomic counter).
    db.collection("products")
      .doc(doc.id)
      .update({ views: FieldValue.increment(1) })
      .catch(() => {});

    const product = transformProduct(doc);
    product.reviews = await fetchReviews(doc.id);
    return Response.json({ data: product });
  } catch (err) {
    console.error("[GET /api/products/[id]] error:", err);
    return Response.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products/[id] — update a product (by id or slug).
 *
 * Body may contain any subset of the listed fields; only provided fields are
 * written. `features`/`screenshots`/`whatsNew`/`requirements` arrive as native
 * arrays and are stored as native Firestore arrays. `updatedAt` is bumped
 * automatically. Returns the updated product (with reviews attached).
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await findProductDoc(id);
    if (!doc) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json(
        { error: "Invalid request body" },
        { status: 400 }
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
      banner,
      telegramFileId,
      slug,
      badge,
      status,
      features,
      screenshots,
      whatsNew,
      requirements,
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
    if (banner !== undefined) data.banner = String(banner);
    if (telegramFileId !== undefined) data.telegramFileId = String(telegramFileId);
    if (slug !== undefined) data.slug = String(slug);
    if (badge !== undefined) data.badge = badge ? String(badge) : null;
    if (status !== undefined) data.status = String(status);
    if (features !== undefined) {
      data.features = Array.isArray(features) ? features.map(String) : [];
    }
    if (screenshots !== undefined) {
      data.screenshots = Array.isArray(screenshots)
        ? screenshots.map(String)
        : [];
    }
    if (whatsNew !== undefined) {
      data.whatsNew = Array.isArray(whatsNew) ? whatsNew.map(String) : [];
    }
    if (requirements !== undefined) {
      data.requirements = Array.isArray(requirements)
        ? requirements.map(String)
        : [];
    }

    data.updatedAt = new Date();

    if (Object.keys(data).length === 1) {
      // Only `updatedAt` was set — no user fields provided.
      return Response.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    await db.collection("products").doc(doc.id).update(data);
    const updated = await db.collection("products").doc(doc.id).get();
    const product = transformProduct(updated);
    product.reviews = await fetchReviews(doc.id);
    return Response.json({ data: product });
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
 *
 * The frontend admin edit form uses PATCH against /api/products/<id>; keep it
 * working alongside the PUT handler.
 */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  return PUT(request, ctx);
}

/**
 * DELETE /api/products/[id] — delete a product (by id or slug) and all of its
 * reviews. Uses a Firestore batch so the deletes are atomic.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await findProductDoc(id);
    if (!doc) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    // Batch-delete the product and all its reviews.
    const reviewsSnap = await db
      .collection("reviews")
      .where("productId", "==", doc.id)
      .get();
    const batch = db.batch();
    reviewsSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(db.collection("products").doc(doc.id));
    await batch.commit();

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/products/[id]] error:", err);
    return Response.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
