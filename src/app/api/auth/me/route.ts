import { getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { getFallbackUserById, isFirestoreUnavailable } from "@/lib/fallback-data";

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
    let freshDoc: { exists?: boolean; id: string; data: () => any } | null = null;
    let fresh: { name?: string; email?: string; role?: string; banned?: boolean; tier?: string } | null = null;

    try {
      freshDoc = await db.collection("users").doc(authUser.id).get();
      if (freshDoc.exists) {
        fresh = freshDoc.data() as typeof fresh;
      }
    } catch (err) {
      if (!isFirestoreUnavailable(err)) {
        throw err;
      }
    }

    if (!freshDoc?.exists) {
      const fallbackUser = getFallbackUserById(authUser.id);
      if (!fallbackUser) {
        return Response.json(
          { error: "Not authenticated" },
          { status: 401 }
        );
      }
      fresh = {
        name: fallbackUser.name,
        email: fallbackUser.email,
        role: fallbackUser.role,
        banned: fallbackUser.banned,
        tier: fallbackUser.tier,
      };
    }

    return Response.json({
      user: {
        id: authUser.id,
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
