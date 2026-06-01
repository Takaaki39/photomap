import { apiFetchSafe } from "@/shared/api/http";
import type { MeProfile } from "../types";

export async function fetchMyProfile(): Promise<MeProfile | null> {
  const result = await apiFetchSafe<{ profile?: MeProfile }>("/api/me/profile", {
    cache: "no-store",
  });
  if (!result.ok) return null;
  return result.data.profile ?? null;
}

export async function updateMyProfile(formData: FormData): Promise<{
  ok: true;
  avatar_url?: string | null;
} | { ok: false; error: string }> {
  const result = await apiFetchSafe<{ error?: string; avatar_url?: string | null }>(
    "/api/me/profile",
    { method: "PATCH", body: formData },
  );
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, avatar_url: result.data.avatar_url };
}

export async function deleteMyAccount(): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await apiFetchSafe<{ error?: string }>("/api/me/account", {
    method: "DELETE",
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}
