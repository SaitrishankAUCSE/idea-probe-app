/**
 * ============================================
 * IdeaProbe — Stripe Client SDK
 * ============================================
 *
 * WHAT THIS FILE DOES:
 * Loads the Stripe.js client library for the browser.
 * This is used to redirect users to Stripe Checkout and render
 * Stripe Elements (credit card input fields).
 *
 * CLIENT vs SERVER STRIPE — THE KEY DIFFERENCE:
 *
 *   SERVER (lib/stripe.ts):
 *   - Uses the SECRET key (sk_test_... or sk_live_...)
 *   - Can create charges, manage subscriptions, read payment data
 *   - Runs in API routes — NEVER in the browser
 *
 *   CLIENT (this file):
 *   - Uses the PUBLISHABLE key (pk_test_... or pk_live_...)
 *   - Can only redirect to Checkout and render payment forms
 *   - Runs in the browser — safe to expose
 *   - Cannot create charges or read sensitive data
 *
 * WHY loadStripe IS LAZY:
 * The loadStripe function doesn't immediately load Stripe.js.
 * Instead, it returns a Promise that:
 *   1. Injects a <script src="https://js.stripe.com/v3/"> tag
 *   2. Waits for it to load
 *   3. Resolves with the Stripe instance
 *
 * This lazy loading is important because:
 *   - Stripe.js is ~40KB — we don't want to load it on pages that
 *     don't need payments (home page, results page, etc.)
 *   - The Promise is cached — calling loadStripe twice with the same
 *     key returns the same Promise, so Stripe.js is loaded only once
 *   - It works with Next.js SSR — loadStripe is safe to call during
 *     server rendering (it just returns null on the server)
 *
 * HOW THIS IS USED:
 *   import { stripePromise } from '@/lib/stripe-client';
 *
 *   // In a component that needs Stripe Checkout:
 *   const handleUpgrade = async (sessionId: string) => {
 *     const stripe = await stripePromise;
 *     await stripe?.redirectToCheckout({ sessionId });
 *   };
 *
 *   // Or with Stripe Elements (embedded card form):
 *   import { Elements } from '@stripe/react-stripe-js';
 *   <Elements stripe={stripePromise}>
 *     <PaymentForm />
 *   </Elements>
 */

import { loadStripe } from '@stripe/stripe-js';

/**
 * Stripe client instance (as a Promise).
 *
 * WHY A PROMISE AND NOT AN INSTANCE:
 * Unlike the server SDK (which initializes synchronously), the client SDK
 * loads asynchronously because it fetches a <script> from Stripe's CDN.
 * We store the Promise so that:
 *   1. Multiple components can `await stripePromise` without triggering
 *      multiple script loads
 *   2. The Promise resolves immediately on subsequent calls (cached)
 *   3. TypeScript knows the type is `Stripe | null` (null if loading fails)
 *
 * THE PUBLISHABLE KEY:
 * Unlike the secret key, the publishable key is:
 *   - Prefixed with pk_test_ (development) or pk_live_ (production)
 *   - Prefixed with NEXT_PUBLIC_ in our env vars (browser-safe)
 *   - Only allows creating tokens and redirecting to Checkout
 *   - Safe to commit to public repos (though we don't — env vars are better)
 */
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);
