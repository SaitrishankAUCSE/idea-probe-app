/**
 * ============================================
 * IdeaProbe — Razorpay SDK Initialization
 * ============================================
 *
 * WHY THIS FILE EXISTS:
 * Centralizes Razorpay SDK setup so every API route imports the same
 * pre-configured instance. This is the server-side SDK — it uses your
 * secret key and must NEVER be exposed to the browser.
 *
 * ENVIRONMENT VARIABLES NEEDED:
 *   RAZORPAY_KEY_ID     — Your Razorpay Key ID (starts with "rzp_test_" or "rzp_live_")
 *   RAZORPAY_KEY_SECRET — Your Razorpay Key Secret (keep this SECRET, never prefix with NEXT_PUBLIC_)
 *
 * WHY DUMMY FALLBACKS:
 * During `next build`, Next.js evaluates server files to generate the build output.
 * If the env vars are missing at build time (common in CI/CD), the SDK constructor
 * would throw. Dummy values let the build succeed — they'll be replaced by real
 * values at runtime via your hosting platform's environment configuration.
 */

import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "dummy_key",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
});

export { razorpay };
