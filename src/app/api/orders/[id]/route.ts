import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/** PATCH /api/orders/[id] — update order status */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    if (!status) {
      return Response.json({ error: "Missing status" }, { status: 400 });
    }
    const updated = await db.order.update({
      where: { id },
      data: { status },
    });
    return Response.json({ data: { id: updated.id, status: updated.status } });
  } catch (err) {
    console.error("[PATCH /api/orders/[id]] error:", err);
    return Response.json({ error: "Failed to update order" }, { status: 500 });
  }
}

/** DELETE /api/orders/[id] — delete an order */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.order.delete({ where: { id } });
    return Response.json({ message: "Order deleted" });
  } catch (err) {
    console.error("[DELETE /api/orders/[id]] error:", err);
    return Response.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
