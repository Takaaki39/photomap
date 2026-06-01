import { apiFetchSafe } from "@/shared/api/http";
import type { CustomTag } from "../types";

export async function fetchCustomTags(): Promise<CustomTag[]> {
  const result = await apiFetchSafe<{ tags?: CustomTag[] }>("/api/me/tags", {
    cache: "no-store",
  });
  if (!result.ok) return [];
  return result.data.tags ?? [];
}

export async function createCustomTag(
  tag: string,
): Promise<{ ok: true; tag: CustomTag } | { ok: false; error: string }> {
  const result = await apiFetchSafe<{ tag?: CustomTag; error?: string }>("/api/me/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag }),
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  if (!result.data.tag) {
    return { ok: false, error: result.data.error ?? "タグの追加に失敗しました。" };
  }
  return { ok: true, tag: result.data.tag };
}

export async function deleteCustomTag(
  tagId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await apiFetchSafe<unknown>(`/api/me/tags/${tagId}`, {
    method: "DELETE",
    parseJson: false,
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}
