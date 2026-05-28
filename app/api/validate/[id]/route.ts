import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getValidation } from "@/lib/firestore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = req.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userId = decoded.uid;

    const validation = await getValidation(userId, id);

    if (!validation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(validation);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch validation" }, { status: 500 });
  }
}
