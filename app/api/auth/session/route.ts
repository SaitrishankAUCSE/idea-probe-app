import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

// Called after frontend signs in — exchanges idToken for a session cookie
// AND ensures user profile exists in Firestore with latest login data
export async function POST(req: NextRequest) {
  const { idToken } = await req.json();

  if (!idToken)
    return NextResponse.json({ error: "No token" }, { status: 400 });

  try {
    // Verify the token to get user info
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userEmail = (decodedToken.email || "").toLowerCase();

    // Session cookie lasts 14 days (Firebase maximum)
    const expiresIn = 60 * 60 * 24 * 14 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Ensure user profile exists in Firestore (auto-provision if missing)
    const { FieldValue } = await import("firebase-admin/firestore");
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      // Auto-create profile for users who somehow don't have one
      await userRef.set({
        uid: userId,
        email: userEmail,
        displayName: decodedToken.name || userEmail.split("@")[0] || "User",
        provider: decodedToken.firebase?.sign_in_provider === "google.com" ? "google" : "email",
        role: "user",
        avatar: decodedToken.picture || "",
        plan: "free",
        validationsToday: 0,
        lastValidationDate: "",
        totalValidations: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
        loginCount: 1,
      });
    } else {
      // Update last login timestamp and increment login count
      await userRef.set({
        lastLoginAt: FieldValue.serverTimestamp(),
        loginCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
        // Also ensure email is always stored (fix for old accounts)
        email: userEmail,
      }, { merge: true });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expiresIn / 1000,
      path: "/",
    });
    return response;
  } catch (error: unknown) {
    console.error("Session creation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to create session: ${errorMessage}` }, { status: 401 });
  }
}

// Called on logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("session");
  return response;
}
