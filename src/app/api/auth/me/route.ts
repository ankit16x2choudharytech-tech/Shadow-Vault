import { getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

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
    const fresh = await db.user.findUnique({
      where: { id: authUser.id },
    });
    if (!fresh) {
      return Response.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return Response.json({
      user: {
        id: fresh.id,
        name: fresh.name,
        email: fresh.email,
        role: fresh.role,
        banned: fresh.banned,
        tier: fresh.tier,
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
