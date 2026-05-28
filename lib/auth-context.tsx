"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
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
  deleteUser,
  sendEmailVerification,
  type User,
} from "firebase/auth";

import { doc, setDoc, getDoc, serverTimestamp, increment, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/* ── Types ─────────────────────────────────── */

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profileVerified: boolean;
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

/* ── Helper: check if Firestore profile exists ─────────── */
async function checkProfileExists(uid: string): Promise<boolean> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists();
}

/* ── Helper: create Firestore profile ──────── */
async function createUserProfile(firebaseUser: User, provider: 'email' | 'google', avatar: string): Promise<void> {
  const userRef = doc(db, "users", firebaseUser.uid);
  await setDoc(userRef, {
    uid: firebaseUser.uid,
    email: (firebaseUser.email || "").toLowerCase(),
    displayName:
      firebaseUser.displayName ||
      firebaseUser.email?.split("@")[0] ||
      "Anonymous",
    provider,
    role: "user",
    avatar,
    plan: "free",
    validationsToday: 0,
    lastValidationDate: "",
    validationsThisMonth: 0,
    totalValidations: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    loginCount: 1,
    signupMethod: provider,
    signupDate: new Date().toISOString(),
  });
}

/* ── Helper: track login in Firestore ──────── */
async function trackLogin(uid: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      lastLoginAt: serverTimestamp(),
      loginCount: increment(1),
    },
    { merge: true }
  );
}

/* ── Provider ──────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileVerified, setProfileVerified] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to skip onAuthStateChanged profile check during active login/signup flows.
  // The explicit handlers manage their own Firestore checks and state.
  const skipAutoVerifyRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If an explicit login/signup handler is running, let it manage state.
        // Don't do a competing Firestore check here.
        if (skipAutoVerifyRef.current) {
          setUser(firebaseUser);
          setLoading(false);
          return;
        }

        // For automatic re-auth (page refresh, returning user):
        // Verify the user has a Firestore profile before marking them as verified.
        try {
          const exists = await checkProfileExists(firebaseUser.uid);
          if (exists) {
            setUser(firebaseUser);
            setProfileVerified(true);
          } else {
            // Ghost user (Firebase Auth exists but no Firestore profile).
            // Sign them out silently.
            await firebaseSignOut(auth);
            setUser(null);
            setProfileVerified(false);
          }
        } catch {
          // Firestore check failed (network, permissions, etc.)
          // Keep the user signed in but unverified
          setUser(firebaseUser);
          setProfileVerified(false);
        }
      } else {
        setUser(null);
        setProfileVerified(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /* ── Google Sign-In ──────────────────────── */
  const signInWithGoogle = useCallback(async (isSignUp: boolean = false) => {
    try {
      setError(null);
      skipAutoVerifyRef.current = true; // Prevent onAuthStateChanged from racing

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if Firestore profile exists
      const profileExists = await checkProfileExists(firebaseUser.uid);

      if (isSignUp) {
        // ── SIGNUP flow ──
        if (profileExists) {
          // User already has an account — don't create duplicate
          await firebaseSignOut(auth);
          skipAutoVerifyRef.current = false;
          throw new Error("account-exists");
        }

        // Create the Firestore profile
        await createUserProfile(firebaseUser, "google", firebaseUser.photoURL || "");

        // Create session cookie
        try {
          await createSessionCookie(firebaseUser);
        } catch (sessionErr) {
          await firebaseSignOut(auth);
          skipAutoVerifyRef.current = false;
          throw sessionErr;
        }

        // Everything succeeded — mark as verified
        setUser(firebaseUser);
        setProfileVerified(true);
        skipAutoVerifyRef.current = false;

      } else {
        // ── LOGIN flow ──
        if (!profileExists) {
          // No Firestore profile = user never signed up.
          // Delete the auto-created Firebase Auth user to prevent ghost accounts,
          // then throw.
          try {
            await deleteUser(firebaseUser);
          } catch {
            // If delete fails (e.g. requires re-auth), just sign out
            await firebaseSignOut(auth);
          }
          setUser(null);
          setProfileVerified(false);
          skipAutoVerifyRef.current = false;
          throw new Error("account-not-found");
        }

        // Profile exists — track the login
        await trackLogin(firebaseUser.uid);

        // Create session cookie
        try {
          await createSessionCookie(firebaseUser);
        } catch (sessionErr) {
          await firebaseSignOut(auth);
          skipAutoVerifyRef.current = false;
          throw sessionErr;
        }

        // Everything succeeded — mark as verified
        setUser(firebaseUser);
        setProfileVerified(true);
        skipAutoVerifyRef.current = false;
      }
    } catch (err) {
      skipAutoVerifyRef.current = false;
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
        skipAutoVerifyRef.current = true;

        // Check if user exists in Firestore BEFORE attempting Firebase Auth sign-in
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          skipAutoVerifyRef.current = false;
          throw new Error("account-not-found");
        }

        const result = await signInWithEmailAndPassword(auth, email, password);
        
        // Track the login
        await trackLogin(result.user.uid);
        
        // Create session cookie
        try {
          await createSessionCookie(result.user);
        } catch (sessionErr) {
          await firebaseSignOut(auth);
          skipAutoVerifyRef.current = false;
          throw sessionErr;
        }

        // Everything succeeded
        setUser(result.user);
        setProfileVerified(true);
        skipAutoVerifyRef.current = false;
      } catch (err) {
        skipAutoVerifyRef.current = false;
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
        skipAutoVerifyRef.current = true;

        const result = await createUserWithEmailAndPassword(auth, email, password);

        // Set display name on the Firebase Auth user
        await updateProfile(result.user, { displayName: name });

        // Create Firestore profile
        await createUserProfile(result.user, "email", "");

        // Send email verification
        await sendEmailVerification(result.user);

        // Sign out immediately because email signup requires manual login
        await firebaseSignOut(auth);
        setUser(null);
        setProfileVerified(false);
        skipAutoVerifyRef.current = false;
      } catch (err) {
        skipAutoVerifyRef.current = false;
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
      
      // Check if user exists first to prevent silent failures when
      // email enumeration protection is enabled on Firebase
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("user-not-found");
      }

      const docData = querySnapshot.docs[0].data();
      if (docData.provider === "google") {
        throw new Error("google-provider");
      }
      
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
      setProfileVerified(false);
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-out failed";
      setError(msg);
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    profileVerified,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
