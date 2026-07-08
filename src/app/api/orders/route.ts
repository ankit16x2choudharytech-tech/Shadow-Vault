import { db } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { transformOrder, toISO } from "@/lib/firestore-helpers";

/**
 * GET /api/orders
 *   ?email=<customerEmail>  -> returns that customer's orders (customer dashboard)
 *   (no params)             -> returns recent 50 orders (admin dashboard default)
 *
 * Each returned order includes its `items` array (stored natively inside the
 * order document — no separate `orderItems` collection).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    let snap;
    if (email) {
      // Customer dashboard — their own orders, newest first.
      // Equality filter on customerEmail + orderBy createdAt requires a composite
      // index in Firestore. To avoid index-setup friction we fetch all matching
      // by equality then JS-sort by createdAt desc.
      snap = await db
        .collection("orders")
        .where("customerEmail", "==", email)
        .get();
    } else {
      // Admin dashboard — recent orders. Single orderBy, no equality filter,
      // so no composite index needed. Limit 50 for safety.
      snap = await db
        .collection("orders")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
    }

    let orders = snap.docs.map((d) => transformOrder(d));

    // For the email-filtered branch, sort client-side by createdAt desc.
    if (email) {
      orders = orders.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
    }

    return Response.json({ data: orders });
  } catch (err) {
    console.error("[GET /api/orders] error:", err);
    return Response.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * body: {
 *   customerName, customerEmail,
 *   items: [{ productId }],
 *   couponCode?: string,
 *   paymentId?: string
 * }
 *
 * Simulates a successful Razorpay payment: sets status "PAID",
 * increments product sales (atomic FieldValue.increment), bumps coupon
 * usedCount when a coupon was applied, returns the created order.
 *
 * Tax calc preserved from the Prisma version: total = max(0, subtotal - discount).
 * (The frontend's checkout-modal computes a separate display tax, but the
 * stored order total follows the existing server-side formula.)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, items, couponCode, paymentId } =
      body ?? {};

    if (
      !customerName ||
      !customerEmail ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return Response.json(
        {
          error:
            "Missing required fields: customerName, customerEmail, items[]",
        },
        { status: 400 }
      );
    }

    // Resolve products — Firestore has no `where id in [...]`, so fetch each doc.
    const productIds: string[] = items.map((i: any) => String(i.productId));
    const productDocs = await Promise.all(
      productIds.map((pid) => db.collection("products").doc(pid).get())
    );

    const missing = productDocs.filter((d) => !d.exists);
    if (missing.length > 0) {
      return Response.json(
        { error: "One or more products not found" },
        { status: 400 }
      );
    }

    let subtotal = 0;
    const orderItemsData = productDocs.map((d) => {
      const p = (d.data() ?? {}) as Record<string, any>;
      const price =
        typeof p.price === "number" ? p.price : Number(p.price ?? 0);
      subtotal += price;
      return {
        productId: d.id,
        name: p.name ?? "",
        price,
        version: p.version ?? "1.0.0",
        thumbnail: p.thumbnail ?? "",
      };
    });

    // Validate coupon if provided.
    let discount = 0;
    let appliedCouponCode: string | null = null;
    let appliedCouponId: string | null = null;
    if (couponCode) {
      const codeSnap = await db
        .collection("coupons")
        .where("code", "==", String(couponCode).toUpperCase())
        .limit(1)
        .get();

      if (!codeSnap.empty) {
        const cdoc = codeSnap.docs[0];
        const c = (cdoc.data() ?? {}) as Record<string, any>;
        const now = new Date();
        const expiryIso = toISO(c.expiry);
        const expiry = expiryIso ? new Date(expiryIso) : null;
        const active =
          c.active &&
          (!expiry || expiry >= now) &&
          (typeof c.usedCount === "number" ? c.usedCount : 0) <
            (typeof c.usageLimit === "number" ? c.usageLimit : 0) &&
          subtotal >= (typeof c.minAmount === "number" ? c.minAmount : 0);

        if (active) {
          const value = typeof c.value === "number" ? c.value : Number(c.value ?? 0);
          if (c.type === "PERCENT") {
            const computed = (subtotal * value) / 100;
            discount =
              c.maxDiscount != null
                ? Math.min(computed, Number(c.maxDiscount))
                : computed;
          } else if (c.type === "FLAT") {
            discount = Math.min(value, subtotal);
          }
          discount = Math.floor(discount);
          appliedCouponCode = c.code ?? String(couponCode).toUpperCase();
          appliedCouponId = cdoc.id;
        }
      }
    }

    const total = Math.max(0, subtotal - discount);

    // Generate order number.
    const orderNumber = `SV-${new Date().getFullYear()}-${
      Math.floor(10000 + Math.random() * 89999)
    }`;

    // Build items snapshot for itemsJson (backward compat — JSON string).
    const itemsSnapshot = orderItemsData.map((it) => ({ ...it, qty: 1 }));

    // Create the order document. Items are stored as a native array.
    const orderRef = await db.collection("orders").add({
      orderNumber,
      customerName: String(customerName),
      customerEmail: String(customerEmail),
      total,
      status: "PAID", // simulating successful Razorpay payment
      paymentId: paymentId ? String(paymentId) : `pay_SVDemo${Date.now()}`,
      paymentMethod: "RAZORPAY",
      itemsJson: JSON.stringify(itemsSnapshot),
      couponCode: appliedCouponCode,
      discount,
      createdAt: new Date(),
      items: orderItemsData,
    });

    // Increment product sales (atomic).
    await Promise.all(
      productIds.map((pid) =>
        db
          .collection("products")
          .doc(pid)
          .update({ sales: FieldValue.increment(1) })
      )
    );

    // Increment coupon usedCount if applied (atomic).
    if (appliedCouponId) {
      await db
        .collection("coupons")
        .doc(appliedCouponId)
        .update({ usedCount: FieldValue.increment(1) });
    }

    // Refetch with items to return consistent shape.
    const finalSnap = await orderRef.get();
    return Response.json(
      { data: transformOrder(finalSnap) },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/orders] error:", err);
    return Response.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
