import { db } from "@/lib/firebase";
import { transformCategory } from "@/lib/firestore-helpers";
import { getFallbackCategories, isFirestoreUnavailable } from "@/lib/fallback-data";

/**
 * GET /api/categories
 *
 * List all categories, ordered by createdAt ascending. Single orderBy with no
 * equality filters does not require a composite index in Firestore, so this is
 * a clean query. Returns `{ data: categories[] }`.
 */
export async function GET() {
  try {
    const snap = await db
      .collection("categories")
      .orderBy("createdAt", "asc")
      .get();
    const categories = snap.docs.map(transformCategory);
    return Response.json({ data: categories });
  } catch (err) {
    if (isFirestoreUnavailable(err)) {
      return Response.json({ data: getFallbackCategories() });
    }
    console.error("[GET /api/categories] error:", err);
    return Response.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
