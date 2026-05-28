import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/firestore";

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userId = decoded.uid;

    const profile = await getUserProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      plan: profile.plan || "free",
      used: profile.validationsThisMonth || 0,
      limit: profile.plan === "pro" ? -1 : 3,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
