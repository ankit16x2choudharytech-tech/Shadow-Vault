import { db } from "@/lib/db";
import type { Review } from "@/lib/types";

function transformReview(raw: any): Review {
  return {
    id: raw.id,
    productId: raw.productId,
    userName: raw.userName,
    userAvatar: raw.userAvatar ?? null,
    rating: raw.rating,
    comment: raw.comment,
    verified: raw.verified,
    likes: raw.likes,
    date: raw.date?.toISOString?.() ?? raw.date,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, userName, rating, comment } = body ?? {};

    if (!productId || !userName || rating == null || !comment) {
      return Response.json(
        { error: "Missing required fields: productId, userName, rating, comment" },
        { status: 400 }
      );
    }

    const ratingNum = Number(rating);
    if (Number.isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return Response.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const created = await db.review.create({
      data: {
        productId,
        userName: String(userName).slice(0, 60),
        rating: Math.round(ratingNum),
        comment: String(comment).slice(0, 1000),
        verified: false,
        likes: 0,
        date: new Date(),
      },
    });

    // Recompute product rating average
    const reviews = await db.review.findMany({
      where: { productId },
      select: { rating: true },
    });
    if (reviews.length > 0) {
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      const rounded = Math.round(avg * 10) / 10;
      await db.product.update({
        where: { id: productId },
        data: { rating: rounded },
      });
    }

    return Response.json({ data: transformReview(created) }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/reviews] error:", err);
    return Response.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
