import { db } from "@/lib/firebase";
import { transformUser } from "@/lib/firestore-helpers";

/**
 * GET /api/users — list all users (admin).
 * Single orderBy on createdAt, no equality filter → no composite index needed.
 * Passwords are never included (transformUser omits the field).
 */
export async function GET() {
  try {
    const snap = await db
      .collection("users")
      .orderBy("createdAt", "desc")
      .get();
    return Response.json({
      data: snap.docs.map((d) => transformUser(d)),
    });
  } catch (err) {
    console.error("[GET /api/users] error:", err);
    return Response.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
