"use client";

/**
 * ============================================
 * IdeaProbe — React Auth Context Provider
 * ============================================
 *
 * WHAT THIS FILE DOES:
 * Manages authentication state for the entire app using React Context.
 * It wraps the app in an <AuthProvider> that:
 *   1. Listens for Firebase Auth state changes (login/logout)
 *   2. Provides the current user object to any component
 *   3. Exposes sign-in, sign-up, and sign-out functions
 *   4. Creates Firestore user profiles on first sign-up
 *
 * WHY "use client" DIRECTIVE:
 * This component uses React hooks (useState, useEffect, useContext) and
 * browser-only APIs (Firebase Auth popup). These can't run on the server.
 * The "use client" directive tells Next.js: "This component and everything
 * it renders runs in the browser."
 *
 * THE REACT CONTEXT PATTERN:
 * React Context solves the "prop drilling" problem. Without it, you'd have to
 * pass the `user` object through every component in the tree:
 *
 *   <Layout user={user}>              ← prop drilling
 *     <Header user={user}>
 *       <Nav user={user}>
 *         <Avatar user={user} />
 *       </Nav>
 *     </Header>
 *   </Layout>
 *
 * With Context, ANY component can access auth state directly:
 *
 *   const { user } = useAuth();        ← clean!
 *
 * HOW IT WORKS:
 *   1. createContext() creates a "channel" for data
 *   2. <AuthProvider> wraps the app and provides data to the channel
 *   3. useAuth() hook reads data from the channel
 *   4. When the data changes, only consuming components re-render
 *
 * WHY onAuthStateChanged (NOT a one-time check):
 * Firebase Auth state can change at ANY time:
 *   - User signs in → state goes from null to User
 *   - User signs out → state goes from User to null
 *   - Token refreshes → user object updates silently
 *   - User opens the app in a new tab → Firebase restores the session
 *
 * onAuthStateChanged is an OBSERVER (like addEventListener). It fires
 * a callback every time the auth state changes. A one-time check with
 * getAuth().currentUser would miss all these events and show stale data.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";

import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

// ============================================
// Types for the Auth Context
// ============================================

/**
 * The shape of data that the AuthContext provides to consuming components.
 *
 * WHY SEPARATE `loading` AND `error`:
 *   - `loading: true` → show a spinner (we're checking if user is logged in)
 *   - `loading: false, user: null` → show sign-in page (no user)
 *   - `loading: false, user: User` → show dashboard (user is logged in)
 *   - `error: string` → show error toast (something went wrong)
 *
 * Without `loading`, you'd briefly flash the sign-in page even for
 * logged-in users (because Firebase Auth takes ~1 second to restore the session).
 */
interface AuthContextType {
  /** The currently signed-in Firebase User, or null if not signed in */
  user: User | null;

  /** True while we're checking if a user session exists */
  loading: boolean;

  /** Error message from the most recent auth operation, if any */
  error: string | null;

  /** Sign in with Google via popup */
  signInWithGoogle: () => Promise<void>;

  /** Sign in with email and password */
  signInWithEmail: (email: string, password: string) => Promise<void>;

  /** Create a new account with email and password */
  signUpWithEmail: (email: string, password: string) => Promise<void>;

  /** Sign out the current user */
  signOut: () => Promise<void>;
}

// ============================================
// Create the Context
// ============================================

/**
 * The React Context object itself.
 *
 * WHY `undefined` AS DEFAULT:
 * We use undefined (not null) as the default because it lets us
 * detect "someone used useAuth() outside of <AuthProvider>".
 * If the context value is undefined, we KNOW the provider is missing
 * and can throw a helpful error message.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// useAuth Hook
// ============================================

/**
 * Custom hook to access authentication state and functions.
 *
 * USAGE:
 *   const { user, loading, signOut } = useAuth();
 *
 * WHY A CUSTOM HOOK (not just useContext directly):
 *   1. Type safety — the return type is AuthContextType (not | undefined)
 *   2. Error handling — throws a clear error if used outside <AuthProvider>
 *   3. Convenience — one import instead of importing both useContext and AuthContext
 *
 * THE THROW PATTERN:
 * If someone accidentally uses useAuth() in a component that's NOT inside
 * <AuthProvider>, React's useContext returns undefined (the default).
 * We catch this and throw an explicit error instead of letting the app
 * crash with a confusing "Cannot read property 'user' of undefined" error.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth() must be used within an <AuthProvider>. " +
        "Make sure your component is wrapped in the AuthProvider " +
        "(typically in app/layout.tsx)."
    );
  }

  return context;
}

// ============================================
// AuthProvider Component
// ============================================

/**
 * The AuthProvider wraps the entire app and manages authentication state.
 *
 * WHERE TO USE:
 * In app/layout.tsx, wrap the <body> contents:
 *
 *   import { AuthProvider } from '@/lib/auth-context';
 *
 *   export default function RootLayout({ children }) {
 *     return (
 *       <html>
 *         <body>
 *           <AuthProvider>{children}</AuthProvider>
 *         </body>
 *       </html>
 *     );
 *   }
 *
 * HOW STATE FLOWS:
 *   1. Component mounts → loading=true, user=null
 *   2. onAuthStateChanged fires with restored session (or null)
 *   3. If user exists → loading=false, user=User
 *   4. If no session → loading=false, user=null
 *   5. User signs in/out → onAuthStateChanged fires again → state updates
 *   6. All components using useAuth() re-render with new state
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  /**
   * State management for auth.
   *
   * WHY THREE SEPARATE STATE VARIABLES (not one object):
   * React batches state updates within the same event handler, so
   * setting user + loading in one handler causes one re-render (not two).
   * Separate variables are clearer to read and modify independently.
   */
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Listen for authentication state changes.
   *
   * HOW onAuthStateChanged WORKS:
   *   - It's called IMMEDIATELY with the current auth state
   *     (null if no session, User if session exists)
   *   - Then it's called again every time the state changes
   *   - It returns an UNSUBSCRIBE function — crucial for cleanup
   *
   * WHY THE CLEANUP (return unsubscribe):
   * If we don't unsubscribe when the component unmounts, the listener
   * keeps running and tries to setState on an unmounted component.
   * React warns about this ("Can't perform a React state update on an
   * unmounted component") and it's a memory leak.
   *
   * The empty dependency array [] means this effect runs ONCE on mount
   * and cleans up on unmount — exactly what we want for a global listener.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // Cleanup: unsubscribe when the provider unmounts
    return unsubscribe;
  }, []);

  // ============================================
  // Auth Functions
  // ============================================

  /**
   * Creates a user profile document in Firestore on first sign-up.
   *
   * WHY THIS IS A SEPARATE FUNCTION:
   * Both Google sign-in and email sign-up need to create profiles.
   * Extracting this avoids code duplication.
   *
   * WHY WE CHECK IF THE DOC EXISTS FIRST:
   * A user might sign in with Google, then later sign in with email
   * (or vice versa). Without the existence check, we'd overwrite
   * their profile (and reset their validationsThisMonth counter).
   *
   * THE USER PROFILE STRUCTURE:
   *   - uid: Firebase Auth UID (matches the document ID)
   *   - email: from Firebase Auth
   *   - displayName: from Google, or email prefix for email sign-ups
   *   - plan: everyone starts on 'free'
   *   - validationsThisMonth: starts at 0
   *   - createdAt: Firestore server timestamp (not client clock)
   *   - updatedAt: same as createdAt on first creation
   *
   * WHY serverTimestamp():
   * Client clocks can be wrong (different timezone, skewed, manipulated).
   * serverTimestamp() uses Google's NTP-synced servers, so timestamps
   * are consistent and trustworthy for sorting and billing.
   */
  const createUserProfile = useCallback(async (firebaseUser: User) => {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    // Only create a profile if one doesn't already exist
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName:
          firebaseUser.displayName ||
          firebaseUser.email?.split("@")[0] ||
          "Anonymous",
        plan: "free",
        validationsThisMonth: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }, []);

  /**
   * Sign in with Google using a popup window.
   *
   * HOW GOOGLE AUTH WORKS:
   *   1. signInWithPopup opens a Google sign-in window
   *   2. User selects their Google account and grants permission
   *   3. Google sends an OAuth token back to Firebase
   *   4. Firebase creates/finds the user account and returns the User object
   *   5. onAuthStateChanged fires with the new user
   *   6. Our useEffect updates the state → all components re-render
   *
   * WHY POPUP (not redirect):
   *   - Popup: stays on the same page, faster UX, no page reload
   *   - Redirect: navigates away, then back — slower, more complex state management
   *   - Popup is blocked on some mobile browsers, but redirect is the fallback
   *
   * ERROR HANDLING:
   * Common errors:
   *   - "popup-blocked" → user's browser blocked the popup
   *   - "popup-closed-by-user" → user closed the popup without signing in
   *   - "network-request-failed" → no internet connection
   * We catch all errors and put them in the `error` state for the UI to show.
   */
  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Create Firestore profile for first-time users
      await createUserProfile(result.user);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to sign in with Google";
      setError(message);
      console.error("Google sign-in error:", err);
    }
  }, [createUserProfile]);

  /**
   * Sign in with email and password.
   *
   * IMPORTANT: This only works for users who already have an account
   * created with createUserWithEmailAndPassword. If the email doesn't
   * exist, Firebase throws "auth/user-not-found". If the password is
   * wrong, it throws "auth/wrong-password".
   *
   * WHY WE DON'T CREATE A PROFILE HERE:
   * Email sign-in is for EXISTING users — their profile already exists.
   * Profile creation only happens in signUpWithEmail and signInWithGoogle
   * (where the user might be new).
   */
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null);
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will fire and update the user state
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to sign in with email";
        setError(message);
        console.error("Email sign-in error:", err);
      }
    },
    []
  );

  /**
   * Create a new account with email and password.
   *
   * HOW IT WORKS:
   *   1. Firebase creates a new user in Firebase Auth
   *   2. Firebase signs in the user automatically
   *   3. onAuthStateChanged fires with the new User object
   *   4. We create a Firestore user profile document
   *
   * FIREBASE PASSWORD REQUIREMENTS:
   * By default, Firebase requires passwords to be at least 6 characters.
   * You can add more requirements in Firebase Console → Authentication → Settings.
   *
   * COMMON ERRORS:
   *   - "auth/email-already-in-use" → user already has an account
   *   - "auth/weak-password" → password too short
   *   - "auth/invalid-email" → email format is wrong
   */
  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null);
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Create Firestore profile for the new user
        await createUserProfile(result.user);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to create account";
        setError(message);
        console.error("Email sign-up error:", err);
      }
    },
    [createUserProfile]
  );

  /**
   * Sign out the current user.
   *
   * WHAT HAPPENS ON SIGN OUT:
   *   1. firebaseSignOut clears the local auth session
   *   2. onAuthStateChanged fires with null (no user)
   *   3. Our useEffect sets user to null
   *   4. Components using useAuth() re-render and show signed-out UI
   *
   * The user's Firestore data is NOT deleted — they can sign in again
   * later and pick up where they left off.
   */
  const signOut = useCallback(async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      // onAuthStateChanged will fire and set user to null
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to sign out";
      setError(message);
      console.error("Sign-out error:", err);
    }
  }, []);

  // ============================================
  // Provide the Context Value
  // ============================================

  /**
   * The value object passed to all consuming components.
   *
   * PERFORMANCE NOTE:
   * Every time AuthProvider re-renders, this object is recreated.
   * Since we use useCallback for all functions, their references
   * are stable (they don't cause unnecessary re-renders in children).
   * The user/loading/error values only change when auth state actually changes.
   */
  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
