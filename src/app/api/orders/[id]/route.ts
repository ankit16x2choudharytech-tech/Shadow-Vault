import { db } from "@/lib/firebase";
import { transformOrder } from "@/lib/firestore-helpers";

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
    const existing = await db.collection("orders").doc(id).get();
    if (!existing.exists) {
      return Response.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    await db.collection("orders").doc(id).update({ status: String(status) });
    return Response.json({
      data: { id, status: String(status) },
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
 * Items live as a native array inside the order doc, so a single doc delete
 * removes everything in one shot (no cascade needed).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.collection("orders").doc(id).get();
    if (!existing.exists) {
      return Response.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    await db.collection("orders").doc(id).delete();
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/orders/[id]] error:", err);
    return Response.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders/[id] — fetch a single order by id. Returned for parity with
 * the other resource routes; the frontend doesn't currently hit this directly.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const snap = await db.collection("orders").doc(id).get();
    if (!snap.exists) {
      return Response.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    return Response.json({ data: transformOrder(snap) });
  } catch (err) {
    console.error("[GET /api/orders/[id]] error:", err);
    return Response.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
