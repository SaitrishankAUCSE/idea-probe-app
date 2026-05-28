import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getValidations } from "@/lib/firestore";

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userId = decoded.uid;

    const validations = await getValidations(userId);

    return NextResponse.json({ validations });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
