import { db } from "@/lib/firebase";
import { transformCoupon } from "@/lib/firestore-helpers";

/**
 * GET /api/coupons — list all coupons (admin).
 * Single orderBy, no equality filter → no composite index required.
 */
export async function GET() {
  try {
    const snap = await db
      .collection("coupons")
      .orderBy("createdAt", "desc")
      .get();
    return Response.json({
      data: snap.docs.map((d) => transformCoupon(d)),
    });
  } catch (err) {
    console.error("[GET /api/coupons] error:", err);
    return Response.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

/**
 * POST /api/coupons — create a new coupon (admin).
 * Body: { code, type, value, minAmount?, maxDiscount?, usageLimit?, expiry? }
 *
 * Validates code uniqueness via `.where("code","==",code.toUpperCase()).limit(1)`.
 * Defaults: usageLimit=100, expiry=1 year from now, usedCount=0, active=true.
 * Returns `{ data: coupon, message }` with 201.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, type, value, minAmount, maxDiscount, usageLimit, expiry } =
      body ?? {};

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

    const upperCode = String(code).toUpperCase();
    const existingSnap = await db
      .collection("coupons")
      .where("code", "==", upperCode)
      .limit(1)
      .get();
    if (!existingSnap.empty) {
      return Response.json(
        { error: "Coupon code already exists" },
        { status: 409 }
      );
    }

    const expiryDate = expiry
      ? new Date(expiry)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const ref = await db.collection("coupons").add({
      code: upperCode,
      type,
      value: Number(value),
      minAmount: minAmount ? Number(minAmount) : 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : 100,
      usedCount: 0,
      expiry: expiryDate,
      active: true,
      createdAt: new Date(),
    });

    const snap = await ref.get();
    return Response.json(
      { data: transformCoupon(snap), message: "Coupon created successfully" },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/coupons] error:", err);
    return Response.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
