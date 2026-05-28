import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { validateIdea } from "@/lib/gemini";
import { saveValidation, canValidate, incrementUsage, getUserProfile, isVipEmail } from "@/lib/firestore";

export const maxDuration = 60;

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
    const userEmail = decodedToken.email || "";
    const isAllowed = await canValidate(userId, userEmail);
    if (!isAllowed) {
      return NextResponse.json({ error: "Usage limit exceeded" }, { status: 429 });
    }

    // Fetch profile to get plan — VIP emails override to visionary
    const profile = await getUserProfile(userId);
    const effectivePlan = isVipEmail(userEmail) ? "visionary" : (profile?.plan || "free");

    // 4. Call Gemini AI (this takes ~10-20s due to web search)
    const result = await validateIdea(idea, effectivePlan);

    // 5. Save the result to Firestore
    const validationId = await saveValidation(userId, idea, result);

    // 6. Increment user's usage counter
    await incrementUsage(userId);

    // 7. Return success response with ID so client can redirect
    return NextResponse.json({ success: true, validationId });
    
  } catch (error: unknown) {
    console.error("Validation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Detect overload/rate-limit errors and give a friendly message
    const isOverloaded = errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE") || errorMessage.includes("high demand") || errorMessage.includes("overloaded");
    const isRateLimit = errorMessage.includes("429") || errorMessage.includes("RATE") || errorMessage.includes("quota");
    
    if (isOverloaded) {
      return NextResponse.json(
        { error: "Our AI engine is experiencing high demand right now. Please wait 30 seconds and try again — your idea is worth the wait!" },
        { status: 503 }
      );
    }
    
    if (isRateLimit) {
      return NextResponse.json(
        { error: "We've hit our API rate limit. Please try again in a minute." },
        { status: 429 }
      );
    }

    if (errorMessage.includes("Missing Gemini API key") || errorMessage.includes("API key not valid")) {
      return NextResponse.json(
        { error: "Your Gemini API Key is invalid or expired. Please update it in your environment variables." },
        { status: 500 }
      );
    }
    
    if (errorMessage.includes("JSON_PARSE_FAILED")) {
      return NextResponse.json(
        { error: "AI returned invalid format: " + errorMessage.replace("JSON_PARSE_FAILED: ", "") },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: `Internal Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

