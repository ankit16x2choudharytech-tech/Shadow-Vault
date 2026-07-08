import { db } from "@/lib/firebase";
import { hashPassword } from "@/lib/auth";
import { transformUser } from "@/lib/firestore-helpers";

/**
 * GET /api/users/[id] — return a single user (password excluded).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const snap = await db.collection("users").doc(id).get();
    if (!snap.exists) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    return Response.json({ data: transformUser(snap) });
  } catch (err) {
    console.error("[GET /api/users/[id]] error:", err);
    return Response.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id] — ban/unban a user (admin).
 * Body: { banned: boolean }.
 * Returns the updated user (transformUser — password excluded).
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const { banned } = body as { banned?: boolean };

    if (typeof banned !== "boolean") {
      return Response.json(
        { error: "Missing or invalid 'banned' field (must be boolean)" },
        { status: 400 }
      );
    }

    const existing = await db.collection("users").doc(id).get();
    if (!existing.exists) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    await db.collection("users").doc(id).update({ banned });

    const updated = await db.collection("users").doc(id).get();
    return Response.json({ data: transformUser(updated) });
  } catch (err) {
    console.error("[PUT /api/users/[id]] error:", err);
    return Response.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id] — admin multi-field update.
 * Body: { password?, tier? } (also accepts `banned` for backwards compat).
 *  - password: hashed with bcrypt before write.
 *  - tier:     written as-is (string).
 *  - banned:   written as-is (boolean) when provided.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const { banned, tier, password } = body as {
      banned?: boolean;
      tier?: string;
      password?: string;
    };

    const data: Record<string, unknown> = {};
    if (typeof banned === "boolean") data.banned = banned;
    if (tier) data.tier = String(tier);
    if (password) data.password = await hashPassword(String(password));

    if (Object.keys(data).length === 0) {
      return Response.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const existing = await db.collection("users").doc(id).get();
    if (!existing.exists) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    await db.collection("users").doc(id).update(data);
    const updated = await db.collection("users").doc(id).get();
    return Response.json({ data: transformUser(updated) });
  } catch (err) {
    console.error("[PATCH /api/users/[id]] error:", err);
    return Response.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id] — delete a user account.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.collection("users").doc(id).get();
    if (!existing.exists) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    await db.collection("users").doc(id).delete();
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/users/[id]] error:", err);
    return Response.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
