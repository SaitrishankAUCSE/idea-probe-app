/**
 * ============================================
 * IdeaProbe — Firebase Client SDK Setup
 * ============================================
 *
 * WHAT THIS FILE DOES:
 * Initializes the Firebase CLIENT SDK — the version that runs in the browser.
 * It exports two things every client component needs:
 *   1. `auth` — for signing users in/out
 *   2. `db` — for reading/writing Firestore data
 *
 * CLIENT SDK vs ADMIN SDK:
 * Firebase has TWO SDKs and they serve completely different purposes:
 *
 *   CLIENT SDK (this file):
 *   - Runs in the browser (shipped to users)
 *   - Uses PUBLIC configuration (API key, project ID, etc.)
 *   - Respects Firestore Security Rules (users can only access their own data)
 *   - Uses Firebase Auth to identify the user
 *
 *   ADMIN SDK (firebase-admin.ts):
 *   - Runs ONLY on the server (never shipped to browser)
 *   - Uses SECRET service account credentials
 *   - BYPASSES all security rules (god mode)
 *   - Used in API routes and server actions
 *
 * WHY NEXT_PUBLIC_ PREFIX:
 * Next.js only exposes environment variables to the browser if they start
 * with `NEXT_PUBLIC_`. This is a security feature:
 *   - `NEXT_PUBLIC_FIREBASE_API_KEY` → available in browser JS ✅
 *   - `FIREBASE_PRIVATE_KEY` → server-only, never reaches browser ✅
 *   - `RAZORPAY_KEY_SECRET` → server-only, never reaches browser ✅
 *
 * Despite the name, Firebase API keys are NOT secret. They're project
 * identifiers (like a public phone number), not access credentials.
 * Security is enforced by Firestore Security Rules, not by hiding the key.
 *
 * WHY getApps() GUARD:
 * In Next.js, this module can be imported multiple times:
 *   - By different components on the same page
 *   - During hot module replacement (HMR) in development
 *   - By both client and server-side rendering passes
 * Without the getApps() check, Firebase throws "app already initialized" errors.
 * The pattern: "if no apps exist, initialize; otherwise, use the existing one."
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase configuration object.
 *
 * Every value comes from environment variables defined in .env.local.
 * The NEXT_PUBLIC_ prefix tells Next.js these are safe for the browser.
 *
 * WHERE TO GET THESE VALUES:
 * Firebase Console → Project Settings → General → "Your apps" section
 * Click the web app (</>) icon, and Firebase shows you this exact config.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy_api_key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy_domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy_project_id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy_bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "dummy_sender",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "dummy_app_id",
};

/**
 * Initialize Firebase app — with duplicate-prevention guard.
 *
 * HOW THIS WORKS:
 *   1. getApps() returns an array of all initialized Firebase apps
 *   2. If the array is empty (length === 0), no app exists → initialize one
 *   3. If an app already exists, getApp() returns it (no duplicate created)
 *
 * This pattern is the standard way to handle Firebase in Next.js.
 * Without it, you'd see "Firebase: Firebase App named '[DEFAULT]' already exists"
 * errors during development (hot reloads) and in production (multiple imports).
 */
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Firebase Authentication instance.
 *
 * Used throughout the app for:
 *   - onAuthStateChanged() — listening for login/logout
 *   - signInWithPopup() — Google sign-in
 *   - signInWithEmailAndPassword() — email/password sign-in
 *   - createUserWithEmailAndPassword() — new account registration
 *   - signOut() — logging out
 *
 * The auth instance is a singleton — every component that imports this
 * gets the same instance, so auth state is consistent across the app.
 */
export const auth = getAuth(app);

/**
 * Firestore database instance.
 *
 * Used for all client-side database operations:
 *   - doc() / collection() — referencing documents and collections
 *   - getDoc() / getDocs() — reading data
 *   - setDoc() / updateDoc() — writing data
 *   - onSnapshot() — real-time listeners
 *
 * IMPORTANT: All operations through this instance are subject to
 * Firestore Security Rules. Users can only access data that the
 * rules allow — typically their own profile and validations.
 */
export const db = getFirestore(app);
