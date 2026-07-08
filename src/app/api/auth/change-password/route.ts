import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword, getUserFromRequest } from "@/lib/auth";

/**
 * POST /api/auth/change-password
 * Body: { currentPassword, newPassword }
 *
 * Verifies the current password against the logged-in user's hash, then
 * updates to the new bcrypt-hashed password. Requires a valid JWT cookie.
 */
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { currentPassword, newPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return Response.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return Response.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Fetch the full user record (with password hash) from DB.
    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password.
    const valid = await verifyPassword(currentPassword, dbUser.password);
    if (!valid) {
      return Response.json(
        { error: "Current password is incorrect" },
        { status: 403 }
      );
    }

    // Hash + save the new password.
    const hashed = await hashPassword(newPassword);
    await db.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("[POST /api/auth/change-password] error:", err);
    return Response.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
