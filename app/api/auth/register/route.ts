import { NextResponse } from "next/server";
import { registerUser } from "@/server/services/authService";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }

  const result = await registerUser(email, password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ user: result.user });
}
