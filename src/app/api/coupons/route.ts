import { db } from "@/lib/db";
import type { Coupon } from "@/lib/types";

function transformCoupon(raw: any): Coupon {
  return {
    id: raw.id,
    code: raw.code,
    type: raw.type,
    value: raw.value,
    minAmount: raw.minAmount,
    maxDiscount: raw.maxDiscount ?? null,
    usageLimit: raw.usageLimit,
    usedCount: raw.usedCount,
    expiry: raw.expiry?.toISOString?.() ?? raw.expiry,
    active: raw.active,
    createdAt: raw.createdAt?.toISOString?.() ?? raw.createdAt,
  };
}

/** GET /api/coupons — list all coupons (admin) */
export async function GET() {
  try {
    const rawCoupons = await db.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ data: rawCoupons.map(transformCoupon) });
  } catch (err) {
    console.error("[GET /api/coupons] error:", err);
    return Response.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

/** POST /api/coupons — create a new coupon (admin) */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, type, value, minAmount, maxDiscount, usageLimit, expiry } = body;

    if (!code || !type || value == null) {
      return Response.json(
        { error: "Missing required fields: code, type, value" },
        { status: 400 }
      );
    }

    if (type !== "PERCENT" && type !== "FLAT") {
      return Response.json(
        { error: "Type must be PERCENT or FLAT" },
        { status: 400 }
      );
    }

    const existing = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return Response.json(
        { error: "Coupon code already exists" },
        { status: 409 }
      );
    }

    const created = await db.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value: Number(value),
        minAmount: minAmount ? Number(minAmount) : 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : 100,
        usedCount: 0,
        expiry: expiry ? new Date(expiry) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        active: true,
      },
    });

    return Response.json(
      { data: transformCoupon(created), message: "Coupon created successfully" },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/coupons] error:", err);
    return Response.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
