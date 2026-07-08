import { clearAuthCookie } from "@/lib/auth";

/** POST /api/auth/logout — clear the sv_token cookie */
export async function POST() {
  try {
    const response = Response.json({ ok: true });
    await clearAuthCookie(response);
    return response;
  } catch (err) {
    console.error("[POST /api/auth/logout] error:", err);
    return Response.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
