/**
 * ============================================
 * IdeaProbe — Stripe Server SDK
 * ============================================
 *
 * WHAT THIS FILE DOES:
 * Initializes the Stripe server-side SDK with the SECRET key.
 * This is used in API routes for:
 *   - Creating checkout sessions (starting a subscription)
 *   - Managing customer subscriptions
 *   - Processing webhook events from Stripe
 *
 * WHY THIS IS SERVER-ONLY:
 * The STRIPE_SECRET_KEY can create charges, refund payments, read
 * customer data, and do basically anything on your Stripe account.
 * If this key leaked to the browser, anyone could:
 *   - Create charges on your account
 *   - Read all your customers' payment details
 *   - Issue refunds to themselves
 *
 * That's why:
 *   1. The variable is STRIPE_SECRET_KEY (no NEXT_PUBLIC_ prefix)
 *   2. This file should ONLY be imported in API routes and server actions
 *   3. Next.js will throw an error if you try to import this in client code
 *
 * CLIENT vs SERVER STRIPE:
 *   - Server (this file): Creates sessions, processes payments, manages subscriptions
 *   - Client (stripe-client.ts): Renders Stripe Elements (card input), redirects to checkout
 *   - They work together: server creates a session → client redirects to it
 *
 * THE STRIPE API VERSION:
 * Stripe releases new API versions regularly. By pinning a version,
 * we ensure our code doesn't break when Stripe makes breaking changes.
 * You can update the version when you're ready to adopt new features.
 */

import Stripe from 'stripe';

/**
 * Stripe server SDK instance.
 *
 * CONFIGURATION OPTIONS:
 *   - apiVersion: Pins the Stripe API version. Stripe recommends using
 *     the latest version, but pinning prevents surprise breaking changes.
 *   - typescript: Enables TypeScript-specific features in the SDK.
 *
 * HOW STRIPE AUTHENTICATION WORKS:
 * The secret key is passed in the constructor. Every API call the SDK
 * makes includes this key in the Authorization header. Stripe's servers
 * verify the key and associate the request with your account.
 *
 * USAGE EXAMPLE (in an API route):
 *   import { stripe } from '@/lib/stripe';
 *
 *   const session = await stripe.checkout.sessions.create({
 *     customer: user.stripeCustomerId,
 *     line_items: [{ price: 'price_xxx', quantity: 1 }],
 *     mode: 'subscription',
 *     success_url: `${APP_URL}/dashboard?upgraded=true`,
 *     cancel_url: `${APP_URL}/pricing`,
 *   });
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "dummy_key", {
  /**
   * API version pinning — locks our integration to a specific Stripe API version.
   *
   * WHY: Stripe evolves their API frequently. If we don't pin a version,
   * Stripe uses our account's default version, which could change and break things.
   * By pinning, we control exactly when we adopt API changes.
   *
   * HOW TO UPDATE: Check Stripe's changelog, test with the new version,
   * then update this string. Stripe guarantees backward compatibility within
   * the same version, so this is safe until you explicitly change it.
   */
  apiVersion: '2026-04-22.dahlia',

  /**
   * TypeScript mode — enables better type inference in the SDK.
   * With this on, method return types are more precise and you get
   * better autocomplete in your IDE.
   */
  typescript: true,
});
