import crypto from "crypto";
import { db } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { transformOrder, toISO } from "@/lib/firestore-helpers";

interface OrderData {
  customerName?: string;
  customerEmail?: string;
  items?: Array<{ productId: string }>;
  couponCode?: string | null;
  total?: number;
}

/**
 * POST /api/razorpay/verify
 * Body: {
 *   razorpay_order_id, razorpay_payment_id, razorpay_signature,
 *   orderData: { customerName, customerEmail, items: [{productId}], couponCode?, total }
 * }
 *
 * Verifies the Razorpay payment signature using HMAC SHA256 of
 * `${razorpay_order_id}|${razorpay_payment_id}` signed with
 * RAZORPAY_KEY_SECRET. If valid, creates the Order (status PAID) in Firestore
 * with its items stored as a native array, increments product sales (atomic),
 * and bumps coupon usedCount (atomic) when a coupon code was applied.
 *
 * Demo-mode bypass (preserved from Prisma version): if `razorpay_signature`
 * is literally "demo" or `razorpay_payment_id` starts with `pay_demo_`, the
 * HMAC check is skipped — used by the frontend's demo fallback path.
 *
 * Returns `{ success: true, order: <Order> }`.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = body as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      orderData?: OrderData;
    };

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return Response.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    if (
      !orderData ||
      !orderData.customerName ||
      !orderData.customerEmail ||
      !Array.isArray(orderData.items) ||
      orderData.items.length === 0
    ) {
      return Response.json(
        { error: "Missing orderData" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isDemoMode =
      razorpay_signature === "demo" ||
      razorpay_payment_id.startsWith("pay_demo_");

    if (!isDemoMode) {
      if (!keySecret) {
        return Response.json(
          { error: "Server misconfigured: missing Razorpay secret" },
          { status: 500 }
        );
      }

      // HMAC SHA256 signature verification
      const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return Response.json(
          { error: "Payment verification failed" },
          { status: 400 }
        );
      }
    }

    // Signature valid — create the Order in Firestore.
    const { customerName, customerEmail, items, couponCode, total } =
      orderData;
    const productIds: string[] = items!.map((i) => String(i.productId));
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

    // Validate coupon (if provided) and compute discount.
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
          const value =
            typeof c.value === "number" ? c.value : Number(c.value ?? 0);
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

    const computedTotal = Math.max(0, subtotal - discount);
    const finalTotal =
      typeof total === "number" && Number.isFinite(total)
        ? Math.max(0, Math.floor(total))
        : computedTotal;

    const orderNumber = `SV-${new Date().getFullYear()}-${
      Math.floor(10000 + Math.random() * 89999)
    }`;
    const itemsSnapshot = orderItemsData.map((it) => ({ ...it, qty: 1 }));

    const orderRef = await db.collection("orders").add({
      orderNumber,
      customerName: String(customerName),
      customerEmail: String(customerEmail),
      total: finalTotal,
      status: "PAID",
      paymentId: String(razorpay_payment_id),
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

    const finalSnap = await orderRef.get();
    return Response.json({
      success: true,
      order: transformOrder(finalSnap),
    });
  } catch (err) {
    console.error("[POST /api/razorpay/verify] error:", err);
    return Response.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
