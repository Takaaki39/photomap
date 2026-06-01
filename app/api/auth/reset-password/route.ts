import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/server/services/authService";

export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const redirectTo = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/login`;
  const result = await requestPasswordReset(email, redirectTo);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
