import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { validateIdea } from "@/lib/gemini";
import { saveValidation, canValidate, incrementUsage } from "@/lib/firestore";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
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

    // 4. Call Anthropic Claude API (this takes ~10-20s due to web search)
    const result = await validateIdea(idea);

    // 5. Save the result to Firestore
    const validationId = await saveValidation(userId, idea, result);

    // 6. Increment user's usage counter
    await incrementUsage(userId);

    // 7. Return success response with ID so client can redirect
    return NextResponse.json({ success: true, validationId });
    
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate idea. Please try again." },
      { status: 500 }
    );
  }
}
