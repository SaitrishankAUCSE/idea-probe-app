import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { validateIdea } from "@/lib/gemini";
import { saveValidation, canValidate, incrementUsage, getUserProfile, isVipEmail } from "@/lib/firestore";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the request
    const session = req.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized - No Session" }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifySessionCookie(session, true);
    const userId = decodedToken.uid;

    // 2. Parse request body
    const { idea } = await req.json();
    if (!idea || typeof idea !== "string") {
      return NextResponse.json({ error: "Invalid idea description" }, { status: 400 });
    }

    // 3. Check usage limits
    const isAllowed = await canValidate(userId);
    if (!isAllowed) {
      return NextResponse.json({ error: "Usage limit exceeded" }, { status: 429 });
    }

    // Fetch profile to get plan — VIP emails override to visionary
    const profile = await getUserProfile(userId);
    const effectivePlan = isVipEmail(profile?.email || "") ? "visionary" : (profile?.plan || "free");

    // 4. Call Gemini AI (this takes ~10-20s due to web search)
    const result = await validateIdea(idea, effectivePlan as "free" | "pro" | "elite");

    // 5. Save the result to Firestore
    const validationId = await saveValidation(userId, idea, result);

    // 6. Increment user's usage counter
    await incrementUsage(userId);

    // 7. Return success response with ID so client can redirect
    return NextResponse.json({ success: true, validationId });
    
  } catch (error: unknown) {
    console.error("Validation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to validate idea. (${errorMessage})` },
      { status: 500 }
    );
  }
}

