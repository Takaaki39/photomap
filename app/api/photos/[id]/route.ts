import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type { Database } from "@/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PhotoOwnerRow = Pick<Database["public"]["Tables"]["photos"]["Row"], "id" | "user_id">;
type PhotoDeleteRow = Pick<
  Database["public"]["Tables"]["photos"]["Row"],
  "id" | "user_id" | "storage_url" | "thumbnail_url" | "spot_id"
>;

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { is_public } = (await request.json()) as { is_public?: boolean };
  if (typeof is_public !== "boolean") {
    return NextResponse.json({ error: "is_public must be boolean" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: row, error: rowError } = await admin
    .from("photos")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();
  if (rowError) return NextResponse.json({ error: rowError.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  const ownerRow = row as PhotoOwnerRow;
  if (ownerRow.user_id !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { error } = await admin.from("photos").update({ is_public } as unknown as never).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, context: RouteContext) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const admin = createSupabaseAdminClient();

  const { data: row, error: rowError } = await admin
    .from("photos")
    .select("id, user_id, storage_url, thumbnail_url, spot_id")
    .eq("id", id)
    .maybeSingle();
  if (rowError) return NextResponse.json({ error: rowError.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  const deleteRow = row as PhotoDeleteRow;
  if (deleteRow.user_id !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const paths = [deleteRow.storage_url, deleteRow.thumbnail_url].filter((v): v is string => Boolean(v));
  if (paths.length > 0) {
    await admin.storage.from("photos").remove(paths);
  }

  const { error } = await admin.from("photos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (deleteRow.spot_id) {
    const { count, error: countError } = await admin
      .from("photos")
      .select("id", { count: "exact", head: true })
      .eq("spot_id", deleteRow.spot_id);
    if (!countError && (count ?? 0) === 0) {
      await admin.from("spots").delete().eq("id", deleteRow.spot_id);
    }
  }

  return NextResponse.json({ ok: true });
}
