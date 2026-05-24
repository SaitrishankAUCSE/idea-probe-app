import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/firestore";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const profile = await getUserProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      plan: profile.plan || "free",
      used: profile.validationsThisMonth || 0,
      limit: profile.plan === "pro" ? -1 : 3, // -1 means unlimited
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
