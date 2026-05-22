import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function DELETE(_: Request, context: RouteContext) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "invalid tag id" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: existing, error: lookupError } = await admin
    .from("user_tags")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const row = existing as { id: string; user_id: string };
  if (row.user_id !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // 注意: photos.tag は freeform 文字列なので、削除しても既存写真の tag 値はそのまま残る。
  // 表示側（フィルタ・ピッカー）からは消えるが、地図のスポット集約には残るのが意図的な挙動。
  const { error } = await admin.from("user_tags").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
