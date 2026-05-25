/**
 * ============================================
 * POST /api/razorpay/create-order
 * ============================================
 *
 * WHAT THIS ROUTE DOES:
 * Creates a Razorpay "order" — the server-side record that Razorpay uses
 * to track a payment attempt. The client then uses this order ID to open
 * the Razorpay checkout modal.
 *
 * FLOW:
 *   1. Client sends Firebase ID token in Authorization header
 *   2. We verify the token → extract userId
 *   3. We check the user's profile (optional: skip if already pro)
 *   4. We call razorpay.orders.create() to get an order ID
 *   5. We return the order ID + Razorpay key to the client
 *   6. Client opens Razorpay checkout with this data
 *
 * WHY CREATE AN ORDER ON THE SERVER?
 * Razorpay requires orders to be created server-side using your secret key.
 * This prevents clients from tampering with the amount — the server decides
 * how much to charge, not the browser.
 *
 * AMOUNT NOTE:
 * Razorpay expects amounts in the smallest currency unit.
 * For INR, that's paise: ₹900 = 90000 paise.
 */

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { razorpay } from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // Step 1: Authenticate the user via Firebase ID token
    // --------------------------------------------------
    // The client sends: Authorization: Bearer <idToken>
    // We split on "Bearer " to extract just the token part.
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split("Bearer ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 }
      );
    }

    // verifyIdToken checks the JWT signature with Google's public keys.
    // If the token is expired, revoked, or forged, this throws.
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    // --------------------------------------------------
    // Step 2: Check user's current profile
    // --------------------------------------------------
    // We use the Admin SDK's Firestore (adminDb) here — NOT the client SDK.
    // API routes run on the server, so they must use firebase-admin.
    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const userProfile = userDoc.data();

    // If the user is already Pro, no need to create another order
    if (userProfile?.plan === "pro") {
      return NextResponse.json(
        { error: "User is already on the Pro plan" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Step 3: Create a Razorpay order
    // --------------------------------------------------
    // `receipt` is your internal reference — useful for reconciliation
    // in the Razorpay dashboard. We use the userId so we can trace
    // which user initiated the payment.
    const order = await razorpay.orders.create({
      amount: 900 * 100, // ₹900 in paise
      currency: "INR",
      receipt: `order_${userId}`,
    });

    // --------------------------------------------------
    // Step 4: Return order details to the client
    // --------------------------------------------------
    // The client needs:
    //   - orderId: to pass to Razorpay checkout
    //   - amount/currency: to display in the UI
    //   - key: the PUBLIC key (key_id), safe to expose to the browser
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
