import crypto from "crypto";
import { db } from "@/lib/firebase";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expected !== signature) {
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const order = event.payload?.order?.entity;
      if (payment?.id && order?.id) {
        const snap = await db
          .collection("orders")
          .where("razorpayOrderId", "==", order.id)
          .limit(1)
          .get();

        if (!snap.empty) {
          const ref = snap.docs[0].ref;
          await ref.update({
            status: "PAID",
            paymentStatus: "PAID",
            razorpayPaymentId: payment.id,
            paidAt: new Date(),
          });
        }
      }
    }

    return Response.json({ accepted: true });
  } catch (err) {
    console.error("[POST /api/razorpay/webhook] error:", err);
    return Response.json({ error: "Webhook failed" }, { status: 500 });
  }
}
