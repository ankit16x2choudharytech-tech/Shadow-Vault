import { razorpay } from "@/lib/razorpay";

/**
 * POST /api/razorpay/create-order
 * Body: { amount: number } — amount in whole rupees (integer).
 *
 * Creates a Razorpay order via the official Node SDK. Returns the order id,
 * amount (in paise), currency, and the public key id the client needs to
 * open the Razorpay checkout modal.
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

    const { amount } = body as { amount?: number };

    if (
      amount == null ||
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return Response.json(
        { error: "Invalid amount (must be a positive number of rupees)" },
        { status: 400 }
      );
    }

    const paise = Math.round(amount * 100);

    const order = await razorpay.orders.create({
      amount: paise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    return Response.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error("[POST /api/razorpay/create-order] error:", err);
    const message =
      err?.error?.description ||
      err?.message ||
      "Failed to create Razorpay order";
    return Response.json({ error: message }, { status: 500 });
  }
}
