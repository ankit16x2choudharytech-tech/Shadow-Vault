import { db } from "@/lib/db";

/**
 * PATCH /api/orders/[id] — update order status.
 * Kept for backwards compatibility with the admin dashboard.
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
    const { status } = body as { status?: string };
    if (!status) {
      return Response.json(
        { error: "Missing status" },
        { status: 400 }
      );
    }
    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) {
      return Response.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    const updated = await db.order.update({
      where: { id },
      data: { status: String(status) },
    });
    return Response.json({
      data: { id: updated.id, status: updated.status },
    });
  } catch (err) {
    console.error("[PATCH /api/orders/[id]] error:", err);
    return Response.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders/[id] — delete an order by id.
 * OrderItems cascade-delete via the schema's onDelete: Cascade rule.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) {
      return Response.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    await db.order.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/orders/[id]] error:", err);
    return Response.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
