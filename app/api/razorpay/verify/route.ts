/**
 * ============================================
 * POST /api/razorpay/verify
 * ============================================
 *
 * WHAT THIS ROUTE DOES:
 * After the user completes payment in the Razorpay checkout modal,
 * Razorpay returns three values to the client:
 *   - razorpay_order_id
 *   - razorpay_payment_id
 *   - razorpay_signature
 *
 * The client sends these here for SERVER-SIDE verification.
 *
 * WHY VERIFY ON THE SERVER?
 * A malicious client could skip the payment and directly call your
 * "upgrade to pro" API. By verifying Razorpay's cryptographic signature,
 * we prove that Razorpay actually received the money before upgrading.
 *
 * HOW SIGNATURE VERIFICATION WORKS:
 *   1. Razorpay creates: HMAC-SHA256(order_id + "|" + payment_id, your_key_secret)
 *   2. They send this as `razorpay_signature`
 *   3. We recreate the same HMAC on our server
 *   4. If our HMAC matches theirs → payment is genuine
 *   5. If it doesn't match → someone is trying to forge a payment
 *
 * This is the same pattern used by Stripe webhooks (signature verification),
 * just implemented differently.
 */

import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // Step 1: Authenticate the user
    // --------------------------------------------------
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split("Bearer ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 }
      );
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    // --------------------------------------------------
    // Step 2: Extract Razorpay payment details from request body
    // --------------------------------------------------
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    // All three fields are required for verification
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification fields" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Step 3: Verify the signature
    // --------------------------------------------------
    // Razorpay's signature is: HMAC_SHA256(order_id|payment_id, key_secret)
    // The "|" separator is critical — it prevents order_id/payment_id
    // boundary confusion attacks.
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // Constant-time comparison to prevent timing attacks.
    // timingSafeEqual throws if buffer lengths differ, so we check first.
    const sigBuffer = Buffer.from(razorpay_signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return NextResponse.json(
        { error: "Invalid payment signature — possible tampering detected" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Step 4: Signature valid → Upgrade user to Pro
    // --------------------------------------------------
    // We use the Admin SDK's Firestore to update the user's plan.
    // This bypasses security rules (intentionally — the server verified payment).
    await adminDb
      .collection("users")
      .doc(userId)
      .update({
        plan: "pro",
        razorpayCustomerId: razorpay_payment_id,
        updatedAt: new Date(),
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Razorpay verification failed:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
