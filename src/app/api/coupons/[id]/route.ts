import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/** DELETE /api/coupons/[id] — delete a coupon */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.coupon.delete({ where: { id } });
    return Response.json({ message: "Coupon deleted" });
  } catch (err) {
    console.error("[DELETE /api/coupons/[id]] error:", err);
    return Response.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
