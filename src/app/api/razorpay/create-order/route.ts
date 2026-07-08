import { NextRequest } from "next/server";

/**
 * POST /api/razorpay/create-order
 * Creates a Razorpay order on the server using the Razorpay REST API.
 * Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET env vars.
 * If keys are missing, returns a demo order so the flow can continue
 * in test/demo mode.
 */
export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "INR" } = await request.json();
    if (!amount || amount <= 0) {
      return Response.json({ error: "Invalid amount" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // No keys → demo mode
    if (!keyId || !keySecret) {
      return Response.json({
        demo: true,
        order: {
          id: `order_demo_${Date.now()}`,
          amount: amount * 100,
          currency,
          status: "created",
        },
        key_id: null,
      });
    }

    // Real Razorpay order creation
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // paise
        currency,
        receipt: `rcpt_${Date.now()}`,
        payment_capture: 1,
      }),
    });

    const order = await res.json();
    if (!res.ok) {
      return Response.json(
        { error: order.error?.description || "Failed to create order" },
        { status: 500 }
      );
    }

    return Response.json({
      demo: false,
      order,
      key_id: keyId,
    });
  } catch (err) {
    console.error("[POST /api/razorpay/create-order] error:", err);
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }
}
