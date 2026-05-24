import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/firestore";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const email = decodedToken.email;

    const profile = await getUserProfile(userId);
    let customerId = profile?.stripeCustomerId;

    if (!customerId) {
      // Create Stripe customer if we don't have one
      const customer = await stripe.customers.create({
        email: email,
        metadata: { firebaseUID: userId },
      });
      customerId = customer.id;
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      return NextResponse.json({ error: "Stripe Price ID not configured" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      customer: customerId,
      metadata: {
        firebaseUID: userId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
