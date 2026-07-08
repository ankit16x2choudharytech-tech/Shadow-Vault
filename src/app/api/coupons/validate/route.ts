import { db } from "@/lib/firebase";
import {
  transformCoupon,
  toISO,
} from "@/lib/firestore-helpers";
import type { CouponValidationResult } from "@/lib/types";

/**
 * POST /api/coupons/validate
 * Body: { code, subtotal }
 *
 * Query: `db.collection("coupons").where("code","==",code).limit(1).get()`.
 * Validates: active, not expired (`expiry >= now`), `usedCount < usageLimit`,
 * `subtotal >= minAmount`. Computes discount:
 *   PERCENT: min(subtotal * value / 100, maxDiscount)
 *   FLAT:    min(value, subtotal)
 *
 * Returns `{ data: { valid, discount, coupon } }` on success, or
 * `{ data: { valid: false, message } }` on any validation failure.
 */
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

    const snap = await db
      .collection("coupons")
      .where("code", "==", String(code))
      .limit(1)
      .get();

    if (snap.empty) {
      const result: CouponValidationResult = {
        valid: false,
        message: "Invalid coupon code",
      };
      return Response.json({ data: result });
    }

    const cdoc = snap.docs[0];
    const c = (cdoc.data() ?? {}) as Record<string, any>;
    const coupon = transformCoupon(cdoc);

    // Validation rules
    if (!c.active) {
      const result: CouponValidationResult = {
        valid: false,
        message: "This coupon is no longer active",
      };
      return Response.json({ data: result });
    }

    const expiryIso = toISO(c.expiry);
    if (expiryIso && new Date(expiryIso) < new Date()) {
      const result: CouponValidationResult = {
        valid: false,
        message: "This coupon has expired",
      };
      return Response.json({ data: result });
    }

    const usedCount = typeof c.usedCount === "number" ? c.usedCount : 0;
    const usageLimit = typeof c.usageLimit === "number" ? c.usageLimit : 0;
    if (usedCount >= usageLimit) {
      const result: CouponValidationResult = {
        valid: false,
        message: "This coupon has reached its usage limit",
      };
      return Response.json({ data: result });
    }

    const minAmount = typeof c.minAmount === "number" ? c.minAmount : 0;
    if (subtotalNum < minAmount) {
      const result: CouponValidationResult = {
        valid: false,
        message: `Minimum order amount of ₹${minAmount} required`,
      };
      return Response.json({ data: result });
    }

    // Compute discount
    const value = typeof c.value === "number" ? c.value : Number(c.value ?? 0);
    let discount = 0;
    if (c.type === "PERCENT") {
      const computed = (subtotalNum * value) / 100;
      discount =
        c.maxDiscount != null
          ? Math.min(computed, Number(c.maxDiscount))
          : computed;
    } else if (c.type === "FLAT") {
      discount = Math.min(value, subtotalNum);
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
      coupon,
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
