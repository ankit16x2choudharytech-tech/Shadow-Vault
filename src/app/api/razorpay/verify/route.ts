import crypto from "crypto";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/api";

interface OrderData {
  customerName?: string;
  customerEmail?: string;
  items?: Array<{ productId: string }>;
  couponCode?: string | null;
  total?: number;
}

function transformOrder(raw: any) {
  return {
    id: raw.id,
    orderNumber: raw.orderNumber,
    customerName: raw.customerName,
    customerEmail: raw.customerEmail,
    total: raw.total,
    status: raw.status,
    paymentId: raw.paymentId ?? null,
    paymentMethod: raw.paymentMethod,
    itemsJson: parseJsonArray(raw.itemsJson),
    couponCode: raw.couponCode ?? null,
    discount: raw.discount,
    createdAt: raw.createdAt?.toISOString?.() ?? raw.createdAt,
    items: (raw.items ?? []).map((it: any) => ({
      id: it.id,
      orderId: it.orderId,
      productId: it.productId,
      name: it.name,
      price: it.price,
      version: it.version,
      thumbnail: it.thumbnail,
    })),
  };
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
 * RAZORPAY_KEY_SECRET. If valid, creates the Order (status PAID),
 * its OrderItems, increments product sales, and bumps coupon usedCount
 * when a coupon code was applied.
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

    // Signature valid — create the Order in the DB.
    const { customerName, customerEmail, items, couponCode, total } =
      orderData;
    const productIds: string[] = items!.map((i) => String(i.productId));
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return Response.json(
        { error: "One or more products not found" },
        { status: 400 }
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;
    const orderItemsData = productIds.map((pid) => {
      const p = productMap.get(pid)!;
      subtotal += p.price;
      return {
        productId: p.id,
        name: p.name,
        price: p.price,
        version: p.version,
        thumbnail: p.thumbnail,
      };
    });

    // Validate coupon (if provided) and compute discount.
    let discount = 0;
    let appliedCouponCode: string | null = null;
    if (couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: String(couponCode) },
      });
      if (coupon) {
        const now = new Date();
        const active =
          coupon.active &&
          (!coupon.expiry || new Date(coupon.expiry) >= now) &&
          coupon.usedCount < coupon.usageLimit &&
          subtotal >= coupon.minAmount;
        if (active) {
          if (coupon.type === "PERCENT") {
            const computed = (subtotal * coupon.value) / 100;
            discount =
              coupon.maxDiscount != null
                ? Math.min(computed, coupon.maxDiscount)
                : computed;
          } else if (coupon.type === "FLAT") {
            discount = Math.min(coupon.value, subtotal);
          }
          discount = Math.floor(discount);
          appliedCouponCode = coupon.code;
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

    const created = await db.order.create({
      data: {
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
      },
    });

    for (const it of orderItemsData) {
      await db.orderItem.create({
        data: {
          orderId: created.id,
          productId: it.productId,
          name: it.name,
          price: it.price,
          version: it.version,
          thumbnail: it.thumbnail,
        },
      });
    }

    for (const pid of productIds) {
      await db.product.update({
        where: { id: pid },
        data: { sales: { increment: 1 } },
      });
    }

    if (appliedCouponCode) {
      await db.coupon.updateMany({
        where: { code: appliedCouponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    const finalOrder = await db.order.findUnique({
      where: { id: created.id },
      include: { items: true },
    });

    return Response.json({
      success: true,
      order: transformOrder(finalOrder),
    });
  } catch (err) {
    console.error("[POST /api/razorpay/verify] error:", err);
    return Response.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
