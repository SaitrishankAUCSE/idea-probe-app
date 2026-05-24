import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { updateUserProfile } from "@/lib/firestore";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.firebaseUID;
        if (userId) {
          await updateUserProfile(userId, {
            stripeCustomerId: session.customer as string,
            plan: "pro", // Upgrade user to pro
          });
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Find user by stripeCustomerId
        const { db } = await import("@/lib/firebase");
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        
        const q = query(collection(db, "users"), where("stripeCustomerId", "==", customerId));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const userId = snapshot.docs[0].id;
          await updateUserProfile(userId, {
            plan: "free", // Downgrade user back to free
          });
        }
        break;
      }
      // Add other cases like invoice.payment_failed if needed
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
