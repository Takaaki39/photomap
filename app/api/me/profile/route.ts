import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type { Database } from "@/types";

export async function PATCH(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const icon = formData.get("icon");
  const admin = createSupabaseAdminClient();

  let avatarUrl: string | null | undefined;
  if (icon instanceof File) {
    const path = `avatars/${session.user.id}/${crypto.randomUUID()}-${icon.name.replace(/[^\w.-]/g, "_")}`;
    const { error: uploadError } = await admin.storage
      .from("photos")
      .upload(path, new Uint8Array(await icon.arrayBuffer()), {
        contentType: icon.type || "application/octet-stream",
        upsert: false,
      });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });
    avatarUrl = path;
  }

  const updatePayload: Database["public"]["Tables"]["users"]["Update"] = {
    ...(displayName ? { display_name: displayName } : {}),
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
  };

  const { error } = await admin
    .from("users")
    .update(updatePayload as unknown as never)
    .eq("id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, avatar_url: avatarUrl ?? null });
}
