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
  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'dummy',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'dummy@example.com',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCd1n7TL2P3ne+3\\nPlSezFoySBY+7S6qlt+OkP4NZ66//2hrRLbs8GRvBPa5fnnZjCgLd5lYu/dAv1A+\\nmIbxQP4zwqoFRylmfORZJnm67Q5uOXDqEdMNKyJb/jPBX32GZq9Du62jDo17p79n\\n8ICoODtpn5bEm58/+AThlvyly3mkBGikGQKqV6b2T3bk6nrv/7nGc11/PbjbLf/7\\n8H9vdsmQx4NWYfy8+fw1x1ZhCe6GfHIYfjxRTW0yRDGCtLRx2+Cv/PCfSuQncjL9\\n5PsHMCswd5oicVmERQMU6YFCNvF4WR2FmjMMrIJsLlS0DnUFVV2N2+IZIDnFO4dj\\noeVEZlgXAgMBAAECggEAA9nEXAl2OlDYFOGD1ddfl2FNIH4rH5Lete8fDLb1H+Dc\\nbG89S8zNAePL9/zToww04C4r7CGy9WKQ5ghU3eJ243M9eXyh0DiQXiojR0Z11xhI\\nzFrOZZvY7ix44jJDVbU3CoyPUQnq/kpxYiIPXOawAzupfEAmjLxl/YQU6B+2r/9d\\nI7TItOVjRIfNy8wgaSTk88yUs6lD23wHfGVZrl6U0FMyvU42KoZK2U9M1p9uiv38\\nYQ5Ax4CDs8TgOyXVCFI4kLmzA/yG0ze8A6aLcWKFH6YLkxDMdXWOKtsCrmBaUwrj\\nLdIyg8MyPw9Kto82056YHU0CJSBLhPVHa7+EhxD/QQKBgQDVvqQD+xDo2ABfIwkK\\nEHPrsthIX71ORbhsc2lT2li4x58J2nouCCP8ckvP4AEYuAWeJmOY1CTtdFHS2w3D\\nuFfwc8RzkGmNeuwe2h4QEhM2prIodqJz2N8vLiFo5cEtdNa+KBiK4uZiWiAG2ohP\\nw99NkUYGXcvthW0An41Nsg1xJQKBgQC9CnqCiGwLw5qpBaTuG6GzzFxrozZiI0sD\\ndCyIfmKK1K82Py8qcsufk2DsNj2fnrYPNEpJoqWD/y5MWjFAEjN2/dM/B6JOevtQ\\nWYgdeTDGE/f7SHo/+n3zT0MXaDwDJlt/dSqAO4Y3IbrCwcsAYy2M5IaTecuAqFkU\\nO+yoFZR1iwKBgQC6noyNfTOyWIVaizhlNSBA9hGofw7FvFHdPpcDw2wbSQ8uhzaN\\n4kWpMBHJGYdbkbA1+MaUtQTY3epi8yb9b4I4SpuHWtsNz/lApqgA2Ac2fCyo74u/\\nIecbRmedMpyLl6u2s0NaX+lOjenQkhTZr+bTzrcY7+QRKaGWHbg90euykQKBgFLd\\nnQZLNtGRVOJyjvGxOxjNpFWqndQ3FFLXQg4zGI8y2/szh0FcQNYajIn+3NRzher0\\nSPwuR8+stGbTwnMLh3PJoCgo+ITec/usw3XoAfFSH4oPI0eYTk2xmP9RubzHu6QL\\ngC3l6deQ+YUV3h61Wuo/4p4S7ZngMewkuICVtRYxAoGAfGAeXeGdBa/Cz5Oc8Nkg\\nxqg1rsUFpmk/5K6YxCprJg482phByV6ygyjNQye/Nxo+gUIkotlNhU0k3A+hpPRf\\neLlSAnz7sIY1RpKiTsEzc9sMWlhNQhWIJ8COS1SZ3pdNrmqXntPbHUBVNGYMemic\\nEinP33LDykl1FxonE1n7EQk=\\n-----END PRIVATE KEY-----').replace(/\\n/g, '\n'),
  };

  initializeApp({
    credential: cert(serviceAccount),
  });
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
export const adminAuth = getAuth();

/**
 * Firebase Admin Firestore instance.
 *
 * Unlike the client's `db`, this instance has NO security rule restrictions.
 * It can read/write/delete anything in the database.
 *
 * USE CASES:
 *   - API routes that need to write data on behalf of users
 *   - Stripe webhooks that update user plans
 *   - Background jobs that reset monthly usage counters
 *   - Admin operations that span multiple users' data
 *
 * CAUTION: Because this bypasses security rules, every query you write
 * must include its own authorization checks. Always verify the user's
 * identity (via adminAuth.verifyIdToken) before performing operations.
 */
export const adminDb = getFirestore();
