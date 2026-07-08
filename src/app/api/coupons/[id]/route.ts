import { db } from "@/lib/db";

/**
 * DELETE /api/coupons/[id] — delete a coupon by id.
 * OrderItems cascade is configured at the schema level for orders; coupons
 * have no FK relations, so a straight delete is safe.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) {
      return Response.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }
    await db.coupon.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/coupons/[id]] error:", err);
    return Response.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
