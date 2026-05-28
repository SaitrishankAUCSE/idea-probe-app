"use client";

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
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  getAdditionalUserInfo,
  type User,
} from "firebase/auth";

import { doc, setDoc, getDoc, serverTimestamp, increment } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/* ── Types ─────────────────────────────────── */

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: (isSignUp?: boolean) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth() must be used within an <AuthProvider>.");
  }
  return context;
}

/* ── Helper: create session cookie ─────────── */
async function createSessionCookie(user: User): Promise<void> {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Session creation failed (${res.status})`);
  }
}

/* ── Helper: create Firestore profile and track login ──────── */
async function ensureUserProfile(firebaseUser: User): Promise<void> {
  const userRef = doc(db, "users", firebaseUser.uid);
  const userSnap = await getDoc(userRef);

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
      lastLoginAt: serverTimestamp(),
      loginCount: 1,
    });
  } else {
    await setDoc(
      userRef,
      {
        lastLoginAt: serverTimestamp(),
        loginCount: increment(1),
      },
      { merge: true }
    );
  }
}

/* ── Provider ──────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /* ── Google Sign-In ──────────────────────── */
  const signInWithGoogle = useCallback(async (isSignUp: boolean = false) => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      await ensureUserProfile(result.user);
      
      try {
        await createSessionCookie(result.user);
      } catch (sessionErr) {
        // If server session fails, revert client auth
        await firebaseSignOut(auth);
        throw sessionErr;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      if (!msg.includes("popup-closed-by-user")) {
        setError(msg);
      }
      throw err;
    }
  }, []);

  /* ── Email Sign-In ──────────────────────── */
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null);
        const result = await signInWithEmailAndPassword(auth, email, password);
        
        // Track the login in Firestore
        await ensureUserProfile(result.user);
        
        try {
          await createSessionCookie(result.user);
        } catch (sessionErr) {
          await firebaseSignOut(auth);
          throw sessionErr;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Sign-in failed";
        setError(msg);
        throw err;
      }
    },
    []
  );

  /* ── Email Sign-Up ──────────────────────── */
  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        setError(null);
        const result = await createUserWithEmailAndPassword(auth, email, password);

        // Set display name on the Firebase Auth user
        await updateProfile(result.user, { displayName: name });

        // Create Firestore profile
        await ensureUserProfile(result.user);

        // Create session cookie
        try {
          await createSessionCookie(result.user);
        } catch (sessionErr) {
          await firebaseSignOut(auth);
          throw sessionErr;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Sign-up failed";
        setError(msg);
        throw err;
      }
    },
    []
  );

  /* ── Forgot Password ────────────────────── */
  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Password reset failed";
      setError(msg);
      throw err;
    }
  }, []);

  /* ── Sign Out ────────────────────────────── */
  const signOut = useCallback(async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-out failed";
      setError(msg);
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
