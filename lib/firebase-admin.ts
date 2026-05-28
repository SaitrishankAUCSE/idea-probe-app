/**
 * ============================================
 * IdeaProbe — Firebase Admin SDK (Server-only)
 * ============================================
 *
 * WHAT THIS FILE DOES:
 * Initializes the Firebase ADMIN SDK — the privileged version that runs
 * exclusively on the server. This is the "master key" to your Firebase project.
 *
 * WHY WE NEED BOTH CLIENT AND ADMIN SDKs:
 *
 *   CLIENT SDK (lib/firebase.ts):
 *   - Runs in the browser → user's machine
 *   - Limited by Firestore Security Rules
 *   - Can only do what the logged-in user is allowed to do
 *   - ✅ Perfect for: reading user's own data, updating their profile
 *
 *   ADMIN SDK (this file):
 *   - Runs on the server → your machine / cloud function
 *   - BYPASSES all Security Rules (full access to everything)
 *   - Can verify ID tokens (prove a user is who they claim)
 *   - Can do cross-user operations (e.g., reset ALL monthly counters)
 *   - ✅ Perfect for: API routes, webhooks, background jobs
 *
 * SECURITY CRITICAL:
 * The Admin SDK uses a SERVICE ACCOUNT — a special Google Cloud credential
 * that has unrestricted access to your Firebase project. If this credential
 * leaks, an attacker can read/write/delete ALL your data.
 *
 * That's why:
 *   1. The credentials are in environment variables (not hardcoded)
 *   2. The env vars do NOT have NEXT_PUBLIC_ prefix (never sent to browser)
 *   3. This file should ONLY be imported in:
 *      - API routes (app/api/...)
 *      - Server Actions
 *      - Server Components (but prefer API routes for mutations)
 *
 * FIREBASE_PRIVATE_KEY GOTCHA:
 * The private key in .env.local contains literal `\n` characters.
 * In the JSON file from Firebase, these are actual newlines.
 * Environment variables store them as the string `\n`, so we must
 * call .replace(/\\n/g, '\n') to convert them back to real newlines.
 * Without this, the SDK throws "Invalid PEM" errors.
 */

import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Initialize Firebase Admin — with the same duplicate-prevention pattern.
 *
 * WHY THE SAME getApps() GUARD:
 * Just like the client SDK, the admin SDK can be initialized multiple times
 * in Next.js due to:
 *   - Multiple API routes importing this file
 *   - Hot module replacement during development
 *   - Edge cases in serverless function cold starts
 *
 * The guard ensures we initialize exactly once, then reuse the instance.
 *
 * HOW cert() WORKS:
 * The cert() function creates a credential from a service account object.
 * It expects: { projectId, clientEmail, privateKey }
 * These three values uniquely identify and authenticate your server.
 */
if (getApps().length === 0) {
  /**
   * Build the service account credential from environment variables.
   *
   * WHERE TO GET THESE VALUES:
   * Firebase Console → Project Settings → Service accounts tab
   * Click "Generate new private key" → downloads a JSON file
   * Extract projectId, client_email, and private_key from that JSON
   */
  // Parse the private key — handle every format Vercel might store it in:
  //  1. Actual newlines (Vercel auto-expanded)
  //  2. Literal two-char sequence \n (from pasting JSON value)
  //  3. Wrapped in surrounding quotes
  let rawKey = process.env.FIREBASE_PRIVATE_KEY || '';

  // Strip surrounding double or single quotes
  if ((rawKey.startsWith('"') && rawKey.endsWith('"')) ||
      (rawKey.startsWith("'") && rawKey.endsWith("'"))) {
    rawKey = rawKey.slice(1, -1);
  }

  // Replace literal \n (the two characters backslash + n) with real newlines
  rawKey = rawKey.split('\\n').join('\n');

  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'dummy',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'dummy@example.com',
    privateKey: rawKey || 'dummy_key',
  };

  try {
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

/**
 * Firebase Admin Auth instance.
 *
 * PRIMARY USE CASE: Verifying ID tokens in API routes.
 *
 * HOW TOKEN VERIFICATION WORKS:
 *   1. User signs in on the client → Firebase Auth gives them an ID token (JWT)
 *   2. Client sends this token to your API route in the Authorization header
 *   3. Your API route calls adminAuth.verifyIdToken(token)
 *   4. Firebase checks the token's signature, expiration, and issuer
 *   5. Returns the decoded token with uid, email, etc.
 *   6. Now you KNOW who the user is — no spoofing possible
 *
 * WHY NOT JUST TRUST THE CLIENT?
 * Because clients can be manipulated. A malicious user could:
 *   - Edit their userId in browser DevTools
 *   - Send a fake request pretending to be someone else
 *   - Forge a JWT with someone else's uid
 * Token verification with the Admin SDK catches all of these because
 * only Google's servers can create valid Firebase ID tokens.
 *
 * EXAMPLE USAGE IN AN API ROUTE:
 *   const token = request.headers.get('Authorization')?.split('Bearer ')[1];
 *   const decoded = await adminAuth.verifyIdToken(token);
 *   // decoded.uid is guaranteed to be the real user
 */
export const adminAuth = getApps().length > 0 ? getAuth() : ({} as any);

export const adminDb = getApps().length > 0 ? getFirestore() : ({} as any);
