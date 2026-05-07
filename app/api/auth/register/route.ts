import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function normalizeSupabaseUrl(raw: string) {
  try {
    const u = new URL(raw);
    u.pathname = "";
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return raw.replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "");
  }
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required.");
  }
  return createClient(normalizeSupabaseUrl(url), anon);
}

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ user: data.user });
}
