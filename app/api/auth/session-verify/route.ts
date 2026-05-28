import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const { session } = await req.json();

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return NextResponse.json({ uid: decoded.uid, email: decoded.email });
  } catch (error) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
