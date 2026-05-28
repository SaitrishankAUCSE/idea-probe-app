import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password)
    return NextResponse.json({ error: "All fields required" }, { status: 400 });

  if (password.length < 6)
    return NextResponse.json({ error: "Password min 6 chars" }, { status: 400 });

  try {
    const user = await adminAuth.createUser({
      displayName: name,
      email,
      password,
      emailVerified: false,
    });

    return NextResponse.json({ success: true, uid: user.uid }, { status: 201 });
  } catch (error: any) {
    if (error.code === "auth/email-already-exists")
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    return NextResponse.json({ error: "Signup failed: " + error.message }, { status: 500 });
  }
}
