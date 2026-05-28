import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getUserProfile, isVipEmail } from "@/lib/firestore";

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

    const today = new Date().toISOString().split("T")[0];
    const isNewDay = profile.lastValidationDate !== today;
    const currentUsage = isNewDay ? 0 : (profile.validationsToday || 0);

    // VIP emails always get visionary tier
    const effectivePlan = isVipEmail(profile.email) ? "visionary" : (profile.plan || "free");
    const isUnlimited = effectivePlan === "elite" || effectivePlan === "visionary";

    return NextResponse.json({
      plan: effectivePlan,
      used: currentUsage,
      limit: isUnlimited ? "Unlimited" : (effectivePlan === "pro" ? 10 : 3),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
