import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/** PATCH /api/users/[id] — ban/unban, reset password, or update tier */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { banned, tier, password } = body;

    const data: Record<string, unknown> = {};
    if (typeof banned === "boolean") data.banned = banned;
    if (tier) data.tier = tier;
    if (password) data.password = `hash_${Buffer.from(password).toString("base64")}`;

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        tier: true,
        orders: true,
        spent: true,
        createdAt: true,
      },
    });
    return Response.json({ data: { ...updated, createdAt: updated.createdAt.toISOString() } });
  } catch (err) {
    console.error("[PATCH /api/users/[id]] error:", err);
    return Response.json({ error: "Failed to update user" }, { status: 500 });
  }
}

/** DELETE /api/users/[id] — delete a user */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.user.delete({ where: { id } });
    return Response.json({ message: "User deleted" });
  } catch (err) {
    console.error("[DELETE /api/users/[id]] error:", err);
    return Response.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
