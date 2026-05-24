import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getValidation } from "@/lib/firestore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const validation = await getValidation(userId, id);

    if (!validation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(validation);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch validation" }, { status: 500 });
  }
}
