import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getUserProfile, updateUserProfile, isVipEmail } from "@/lib/firestore";

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userId = decoded.uid;
    const userEmail = (decoded.email || "").toLowerCase();
    const isVip = isVipEmail(userEmail);

    // VIP fast path — always return visionary regardless of profile state
    if (isVip) {
      // Auto-provision VIP profile if missing or has wrong plan
      const profile = await getUserProfile(userId);
      if (!profile || profile.plan !== "visionary") {
        await updateUserProfile(userId, {
          email: userEmail,
          plan: "visionary",
          displayName: decoded.name || "VIP User",
        });
      }
      return NextResponse.json({
        plan: "visionary",
        used: 0,
        limit: "Unlimited",
      });
    }

    // Non-VIP path
    const profile = await getUserProfile(userId);

    if (!profile) {
      // Auto-provision free profile for new users
      await updateUserProfile(userId, {
        email: userEmail,
        plan: "free",
        displayName: decoded.name || "User",
        validationsToday: 0,
        lastValidationDate: "",
      });
      return NextResponse.json({
        plan: "free",
        used: 0,
        limit: 3,
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const isNewDay = profile.lastValidationDate !== today;
    const currentUsage = isNewDay ? 0 : (profile.validationsToday || 0);

    const effectivePlan = profile.plan || "free";
    const isUnlimited = effectivePlan === "elite" || effectivePlan === "visionary";

    return NextResponse.json({
      plan: effectivePlan,
      used: currentUsage,
      limit: isUnlimited ? "Unlimited" : (effectivePlan === "pro" ? 10 : 3),
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
