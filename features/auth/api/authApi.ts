import { apiFetchSafe } from "@/shared/api/http";

export async function registerAccount(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await apiFetchSafe<{ error?: string }>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true };
}

export async function requestPasswordResetEmail(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await apiFetchSafe<{ error?: string }>("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true };
}
