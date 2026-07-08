// ShadowVault — Razorpay SDK singleton

import Razorpay from "razorpay";

/**
 * Shared Razorpay client. Reads `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
 * from the environment. Both must be set; route handlers should fail loudly
 * (500) if they are missing rather than silently falling back to demo mode.
 */
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});
