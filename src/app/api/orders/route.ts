import { db } from "@/lib/db";
import type { Order, OrderItem } from "@/lib/types";

function transformOrderItem(raw: any): OrderItem {
  return {
    id: raw.id,
    orderId: raw.orderId,
    productId: raw.productId,
    name: raw.name,
    price: raw.price,
    version: raw.version,
    thumbnail: raw.thumbnail,
  };
}

function transformOrder(raw: any): Order {
  return {
    id: raw.id,
    orderNumber: raw.orderNumber,
    customerName: raw.customerName,
    customerEmail: raw.customerEmail,
    total: raw.total,
    status: raw.status,
    paymentId: raw.paymentId ?? null,
    paymentMethod: raw.paymentMethod,
    itemsJson: raw.itemsJson,
    couponCode: raw.couponCode ?? null,
    discount: raw.discount,
    createdAt: raw.createdAt?.toISOString?.() ?? raw.createdAt,
    items: raw.items?.map(transformOrderItem),
  };
}

/**
 * GET /api/orders
 *   ?email=<customerEmail>  -> returns that customer's orders (customer dashboard)
 *   ?recent=true            -> returns most recent 10 orders (admin dashboard)
 *   (no params)             -> returns recent orders (admin dashboard default)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (email) {
      const rawOrders = await db.order.findMany({
        where: { customerEmail: email },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
      const orders = rawOrders.map(transformOrder);
      return Response.json({ data: orders });
    }

    // Admin dashboard — recent orders
    const rawRecent = await db.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const recent = rawRecent.map(transformOrder);
    return Response.json({ data: recent });
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
 * Simulates a successful Razorpay payment: sets status "PAID",
 * increments product sales, returns the created order.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      items,
      couponCode,
      paymentId,
    } = body ?? {};

    if (!customerName || !customerEmail || !Array.isArray(items) || items.length === 0) {
      return Response.json(
        {
          error:
            "Missing required fields: customerName, customerEmail, items[]",
        },
        { status: 400 }
      );
    }

    // Resolve products
    const productIds: string[] = items.map((i: any) => i.productId);
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

    // Validate coupon if provided
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

    const total = Math.max(0, subtotal - discount);

    // Generate order number
    const orderNumber = `SV-${new Date().getFullYear()}-${
      Math.floor(10000 + Math.random() * 89999)
    }`;

    const itemsSnapshot = orderItemsData.map((it) => ({ ...it, qty: 1 }));

    const created = await db.order.create({
      data: {
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
      },
      include: { items: true },
    });

    // Create order items
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

    // Increment product sales
    for (const pid of productIds) {
      await db.product.update({
        where: { id: pid },
        data: { sales: { increment: 1 } },
      });
    }

    // Increment coupon usage if applied
    if (appliedCouponCode) {
      await db.coupon.updateMany({
        where: { code: appliedCouponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Refetch with items to return consistent shape
    const finalOrder = await db.order.findUnique({
      where: { id: created.id },
      include: { items: true },
    });

    return Response.json({ data: transformOrder(finalOrder) }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders] error:", err);
    return Response.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
