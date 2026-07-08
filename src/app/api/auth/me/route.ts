import { getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/firebase";

/**
 * GET /api/auth/me — return the currently authenticated user.
 * Reads the `sv_token` cookie, verifies the JWT, and returns the user's
 * profile (including tier and ban status). Returns 401 if not authenticated.
 */
export async function GET(request: Request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return Response.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fetch the freshest tier/orders/spent values from the DB.
    const freshDoc = await db.collection("users").doc(authUser.id).get();
    if (!freshDoc.exists) {
      return Response.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    const fresh = freshDoc.data() as {
      name?: string;
      email?: string;
      role?: string;
      banned?: boolean;
      tier?: string;
    };

    return Response.json({
      user: {
        id: freshDoc.id,
        name: fresh.name ?? "",
        email: fresh.email ?? "",
        role: fresh.role ?? "customer",
        banned: Boolean(fresh.banned),
        tier: fresh.tier ?? "Standard",
      },
    });
  } catch (err) {
    console.error("[GET /api/auth/me] error:", err);
    return Response.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }
}
