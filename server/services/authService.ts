import "server-only";

import { createClient } from "@supabase/supabase-js";

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

export async function registerUser(
  email: string,
  password: string,
): Promise<{ ok: true; user: unknown } | { ok: false; error: string }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, user: data.user };
}

export async function requestPasswordReset(
  email: string,
  redirectTo: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
