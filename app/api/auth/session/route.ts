import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

// Called after frontend signs in — exchanges idToken for a session cookie
export async function POST(req: NextRequest) {
  const { idToken } = await req.json();

  if (!idToken)
    return NextResponse.json({ error: "No token" }, { status: 400 });

  try {
    // Session cookie lasts 14 days (Firebase maximum)
    const expiresIn = 60 * 60 * 24 * 14 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

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
