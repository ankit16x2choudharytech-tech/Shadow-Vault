import { NextRequest } from "next/server";
import crypto from "crypto";

/**
 * POST /api/razorpay/verify
 * Verifies the Razorpay payment signature using HMAC SHA256.
 * Requires RAZORPAY_KEY_SECRET. If missing (demo mode), auto-passes.
 */
export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!razorpay_order_id || !razorpay_payment_id) {
      return Response.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Demo mode — auto-verify
    if (!keySecret || razorpay_order_id.startsWith("order_demo_")) {
      return Response.json({
        verified: true,
        demo: true,
        payment_id: razorpay_payment_id,
      });
    }

    // Real signature verification
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return Response.json(
        { error: "Payment signature verification failed" },
        { status: 400 }
      );
    }

    return Response.json({
      verified: true,
      demo: false,
      payment_id: razorpay_payment_id,
    });
  } catch (err) {
    console.error("[POST /api/razorpay/verify] error:", err);
    return Response.json({ error: "Verification failed" }, { status: 500 });
  }
}
