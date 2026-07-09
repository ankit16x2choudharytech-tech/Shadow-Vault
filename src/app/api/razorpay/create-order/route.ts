import { razorpay } from "@/lib/razorpay";

interface CreateOrderBody {
  amount?: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  payment_capture?: number;
}

/**
 * POST /api/razorpay/create-order
 * Body: { amount: number, currency?: string, receipt?: string, notes?: object }
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

    const {
      amount,
      currency = "INR",
      receipt,
      notes,
      payment_capture = 1,
    } = body as CreateOrderBody;

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

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return Response.json(
        { error: "Razorpay is not configured on the server" },
        { status: 500 }
      );
    }

    const paise = Math.round(amount * 100);
    const order = await razorpay.orders.create({
      amount: paise,
      currency,
      receipt:
        receipt ?? `sv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      notes: {
        ...(notes ?? {}),
        source: "shadowvault",
      },
      payment_capture,
    });

    return Response.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      receipt: order.receipt,
      mode: process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live_")
        ? "live"
        : "test",
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
