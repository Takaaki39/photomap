import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required.");
  }
  return createClient(url, anon);
}

export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const redirectTo = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/login`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
