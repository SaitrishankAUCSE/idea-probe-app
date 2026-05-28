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

import { NextResponse, NextRequest } from "next/server";
import crypto from "crypto";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { razorpay } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  try {
    // --------------------------------------------------
    // 1. Authenticate the request via session cookie
    const session = request.cookies.get("session")?.value;

    if (!session) {
      return NextResponse.json(
        { error: "Missing session cookie" },
        { status: 401 }
      );
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
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
    // Step 4: Signature valid → Fetch order notes to find plan
    // --------------------------------------------------
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const plan = (order as { notes?: { plan?: string } }).notes?.plan || "pro";

    // --------------------------------------------------
    // Step 5: Upgrade user to the correct plan and save payment details
    // --------------------------------------------------
    const validPlans = ["pro", "elite", "visionary"];
    const effectivePlan = validPlans.includes(plan) ? plan : "pro";

    const { FieldValue } = await import("firebase-admin/firestore");

    // Update user profile with new plan
    await adminDb
      .collection("users")
      .doc(userId)
      .set({
        plan: effectivePlan,
        razorpayCustomerId: razorpay_payment_id,
        lastPaymentId: razorpay_payment_id,
        lastPaymentOrderId: razorpay_order_id,
        upgradedAt: new Date().toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

    // Save payment record to payments subcollection for history
    await adminDb
      .collection("users")
      .doc(userId)
      .collection("payments")
      .add({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        plan: effectivePlan,
        amount: (order as { amount?: number }).amount || 0,
        currency: (order as { currency?: string }).currency || "INR",
        status: "verified",
        createdAt: new Date().toISOString(),
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
