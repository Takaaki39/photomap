import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import {
  BUILTIN_PHOTO_TAGS,
  MAX_CUSTOM_TAG_LENGTH,
  normalizeCustomTag,
} from "@/lib/photoTag";
import { createSupabaseAdminClient } from "@/lib/supabase";

type UserTagRow = { id: string; tag: string; created_at: string };

const BUILTIN_RESERVED = new Set(
  BUILTIN_PHOTO_TAGS.flatMap((t) => [t.value, t.label]),
);

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("user_tags")
    .select("id, tag, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as UserTagRow[];
  return NextResponse.json({
    tags: rows.map((r) => ({ id: r.id, tag: r.tag, created_at: r.created_at })),
  });
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { tag?: unknown };
  try {
    body = (await request.json()) as { tag?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const normalized = normalizeCustomTag(body.tag);
  if (!normalized) {
    return NextResponse.json(
      { error: `タグ名は 1〜${MAX_CUSTOM_TAG_LENGTH} 文字で入力してください。` },
      { status: 422 },
    );
  }
  if (BUILTIN_RESERVED.has(normalized)) {
    return NextResponse.json(
      { error: "デフォルトのタグと同名は登録できません。" },
      { status: 409 },
    );
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("user_tags")
    .insert({ user_id: session.user.id, tag: normalized } as unknown as never)
    .select("id, tag, created_at")
    .single();

  if (error) {
    // unique 違反は 409 で返す
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "同じ名前のタグが既に存在します。" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const row = data as UserTagRow;
  return NextResponse.json({ tag: { id: row.id, tag: row.tag, created_at: row.created_at } });
}
