import { db } from "@/lib/db";
import type { Coupon, CouponValidationResult } from "@/lib/types";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, subtotal } = body ?? {};

    if (!code || subtotal == null) {
      return Response.json(
        { error: "Missing required fields: code, subtotal" },
        { status: 400 }
      );
    }

    const subtotalNum = Number(subtotal);
    if (Number.isNaN(subtotalNum) || subtotalNum < 0) {
      return Response.json(
        { error: "subtotal must be a non-negative number" },
        { status: 400 }
      );
    }

    const raw = await db.coupon.findUnique({ where: { code: String(code) } });

    if (!raw) {
      const result: CouponValidationResult = {
        valid: false,
        message: "Invalid coupon code",
      };
      return Response.json({ data: result });
    }

    // Validation rules
    if (!raw.active) {
      const result: CouponValidationResult = {
        valid: false,
        message: "This coupon is no longer active",
      };
      return Response.json({ data: result });
    }

    if (raw.expiry && new Date(raw.expiry) < new Date()) {
      const result: CouponValidationResult = {
        valid: false,
        message: "This coupon has expired",
      };
      return Response.json({ data: result });
    }

    if (raw.usedCount >= raw.usageLimit) {
      const result: CouponValidationResult = {
        valid: false,
        message: "This coupon has reached its usage limit",
      };
      return Response.json({ data: result });
    }

    if (subtotalNum < raw.minAmount) {
      const result: CouponValidationResult = {
        valid: false,
        message: `Minimum order amount of ₹${raw.minAmount} required`,
      };
      return Response.json({ data: result });
    }

    // Compute discount
    let discount = 0;
    if (raw.type === "PERCENT") {
      const computed = (subtotalNum * raw.value) / 100;
      discount =
        raw.maxDiscount != null
          ? Math.min(computed, raw.maxDiscount)
          : computed;
    } else if (raw.type === "FLAT") {
      discount = Math.min(raw.value, subtotalNum);
    } else {
      const result: CouponValidationResult = {
        valid: false,
        message: "Unknown coupon type",
      };
      return Response.json({ data: result });
    }

    discount = Math.floor(discount);

    const result: CouponValidationResult = {
      valid: true,
      discount,
      coupon: transformCoupon(raw),
    };
    return Response.json({ data: result });
  } catch (err) {
    console.error("[POST /api/coupons/validate] error:", err);
    return Response.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
