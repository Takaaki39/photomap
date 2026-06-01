import "server-only";

import {
  BUILTIN_PHOTO_TAGS,
  MAX_CUSTOM_TAG_LENGTH,
  normalizeCustomTag,
} from "@/lib/photoTag";
import { createSupabaseAdminClient } from "@/lib/supabase";

export type UserTagDto = { id: string; tag: string; created_at: string };

const BUILTIN_RESERVED = new Set(
  BUILTIN_PHOTO_TAGS.flatMap((t) => [t.value, t.label]),
);

export async function listUserTags(userId: string): Promise<UserTagDto[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("user_tags")
    .select("id, tag, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as UserTagDto[];
  return rows.map((r) => ({ id: r.id, tag: r.tag, created_at: r.created_at }));
}

export type CreateTagResult =
  | { ok: true; tag: UserTagDto }
  | { ok: false; status: number; error: string };

export async function createUserTag(userId: string, rawTag: unknown): Promise<CreateTagResult> {
  const normalized = normalizeCustomTag(rawTag);
  if (!normalized) {
    return {
      ok: false,
      status: 422,
      error: `タグ名は 1〜${MAX_CUSTOM_TAG_LENGTH} 文字で入力してください。`,
    };
  }
  if (BUILTIN_RESERVED.has(normalized)) {
    return {
      ok: false,
      status: 409,
      error: "デフォルトのタグと同名は登録できません。",
    };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("user_tags")
    .insert({ user_id: userId, tag: normalized } as unknown as never)
    .select("id, tag, created_at")
    .single();

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return { ok: false, status: 409, error: "同じ名前のタグが既に存在します。" };
    }
    return { ok: false, status: 500, error: error.message };
  }

  const row = data as UserTagDto;
  return { ok: true, tag: { id: row.id, tag: row.tag, created_at: row.created_at } };
}

export async function deleteUserTag(
  userId: string,
  tagId: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("user_tags")
    .delete()
    .eq("id", tagId)
    .eq("user_id", userId);
  if (error) return { ok: false, status: 500, error: error.message };
  return { ok: true };
}
