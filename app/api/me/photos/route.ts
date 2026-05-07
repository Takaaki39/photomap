import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { createSignedPhotoUrl } from "@/lib/photoUrl";

type MePhotoRow = {
  id: string;
  user_id: string;
  spot_id: string;
  storage_url: string;
  thumbnail_url: string | null;
  is_public: boolean;
  created_at: string;
  spots: { name: string } | null;
};

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const visibility = searchParams.get("visibility");

  const admin = createSupabaseAdminClient();
  let query = admin
    .from("photos")
    .select("id, user_id, spot_id, storage_url, thumbnail_url, is_public, created_at, spots(name)")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (visibility === "public") query = query.eq("is_public", true);
  if (visibility === "private") query = query.eq("is_public", false);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", `${to}T23:59:59.999Z`);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as MePhotoRow[];
  let photos = await Promise.all(
    rows.map(async (row) => {
      const signedThumb = await createSignedPhotoUrl(row.thumbnail_url, 3600);
      const signedOriginal = await createSignedPhotoUrl(row.storage_url, 3600);
      return {
        id: row.id,
        spot_id: row.spot_id,
        spot_name: row.spots?.name ?? "",
        image_url: signedThumb ?? signedOriginal,
        storage_url: signedOriginal,
        storage_path: row.storage_url,
        is_public: row.is_public,
        created_at: row.created_at,
      };
    })
  );

  if (q) {
    const lower = q.toLowerCase();
    photos = photos.filter((p) => p.spot_name.toLowerCase().includes(lower));
  }

  return NextResponse.json({ photos });
}
