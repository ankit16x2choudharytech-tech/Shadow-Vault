import { db } from "@/lib/firebase";

/**
 * DELETE /api/coupons/[id] — delete a coupon by id.
 * Coupons have no FK relations, so a straight delete is safe.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.collection("coupons").doc(id).get();
    if (!existing.exists) {
      return Response.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }
    await db.collection("coupons").doc(id).delete();
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/coupons/[id]] error:", err);
    return Response.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
