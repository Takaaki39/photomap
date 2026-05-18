import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { createSupabaseAdminClient, supabase } from "@/lib/supabase";
import { createSignedPhotoUrl } from "@/lib/photoUrl";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

const MAX_SPOTS = 40;
const MAX_PHOTOS = 200;

type PhotoRow = {
  id: string;
  user_id: string;
  spot_id: string;
  storage_url: string;
  thumbnail_url: string | null;
  is_public: boolean;
  created_at: string;
  taken_at: string | null;
  users: { display_name: string | null } | null;
};

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("ids") ?? "";
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const spotIds = [...new Set(parts.filter(isUuid))].slice(0, MAX_SPOTS);
  if (spotIds.length === 0) {
    return NextResponse.json({ error: "no valid spot ids" }, { status: 400 });
  }

  const client = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdminClient() : supabase;
  const viewerId = session.user.id;

  const { data, error } = await client
    .from("photos")
    .select("id, user_id, spot_id, storage_url, thumbnail_url, is_public, created_at, taken_at, users(display_name)")
    .in("spot_id", spotIds)
    .order("created_at", { ascending: false })
    .limit(MAX_PHOTOS);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as PhotoRow[];
  const visible = rows.filter((row) => row.is_public || row.user_id === viewerId);

  const photos = await Promise.all(
    visible.map(async (row) => {
      const signedThumb = await createSignedPhotoUrl(row.thumbnail_url, 3600);
      const signedOriginal = await createSignedPhotoUrl(row.storage_url, 3600);
      return {
        id: row.id,
        spot_id: row.spot_id,
        image_url: signedThumb ?? signedOriginal,
        created_at: row.created_at,
        taken_at: row.taken_at,
      };
    }),
  );

  return NextResponse.json({
    spotIds,
    photos,
    total: photos.length,
  });
}
