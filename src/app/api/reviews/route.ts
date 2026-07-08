import { db } from "@/lib/firebase";
import { transformReview } from "@/lib/firestore-helpers";

/**
 * POST /api/reviews
 *
 * Body: `{ productId, userName, rating, comment }`.
 *
 * Creates a review (verified=false, likes=0, userAvatar=null, date=now), then
 * recomputes the parent product's `rating` as the average of all its review
 * ratings (rounded to 1 decimal) and writes that back to the product doc.
 *
 * Returns the created review with status 201.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, userName, rating, comment } = body ?? {};

    if (!productId || !userName || rating == null || !comment) {
      return Response.json(
        {
          error:
            "Missing required fields: productId, userName, rating, comment",
        },
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

    // Verify product exists.
    const productDoc = await db.collection("products").doc(productId).get();
    if (!productDoc.exists) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const ref = await db.collection("reviews").add({
      productId,
      userName: String(userName).slice(0, 60),
      userAvatar: null,
      rating: Math.round(ratingNum),
      comment: String(comment).slice(0, 1000),
      verified: false,
      likes: 0,
      date: new Date(),
    });

    const created = await ref.get();

    // Recompute product rating average across all of its reviews.
    const reviewsSnap = await db
      .collection("reviews")
      .where("productId", "==", productId)
      .get();
    const ratings = reviewsSnap.docs
      .map((d) => (d.data() ?? {}).rating)
      .filter((r) => typeof r === "number");
    if (ratings.length > 0) {
      const avg = ratings.reduce((s, r) => s + (r as number), 0) / ratings.length;
      const rounded = Math.round(avg * 10) / 10;
      await db
        .collection("products")
        .doc(productId)
        .update({ rating: rounded });
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
