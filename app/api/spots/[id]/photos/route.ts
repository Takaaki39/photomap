import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { createSupabaseAdminClient, supabase } from "@/lib/supabase";
import { createSignedPhotoUrl } from "@/lib/photoUrl";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

type SpotPhotoRow = {
  id: string;
  user_id: string;
  spot_id: string;
  storage_url: string;
  thumbnail_url: string | null;
  is_public: boolean;
  created_at: string;
  users: { display_name: string | null } | null;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "invalid spot id" }, { status: 400 });
  }
  const session = await getServerAuthSession();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const client = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdminClient() : supabase;

  const { data, error, count } = await client
    .from("photos")
    .select("id, user_id, spot_id, storage_url, thumbnail_url, is_public, created_at, users(display_name)", {
      count: "exact",
    })
    .eq("spot_id", id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const viewerId = session?.user?.id;
  const rows = (data ?? []) as unknown as SpotPhotoRow[];
  const photos = await Promise.all(
    rows
      .filter((row) => row.is_public || (viewerId ? row.user_id === viewerId : false))
      .map(async (row) => {
        const signedThumb = await createSignedPhotoUrl(row.thumbnail_url, 3600);
        const signedOriginal = await createSignedPhotoUrl(row.storage_url, 3600);
        return {
          id: row.id,
          user_id: row.user_id,
          spot_id: row.spot_id,
          image_url: signedThumb ?? signedOriginal,
          storage_url: signedOriginal,
          storage_path: row.storage_url,
          is_public: row.is_public,
          created_at: row.created_at,
          author_name: row.users?.display_name ?? "Unknown",
        };
      })
  );

  return NextResponse.json({
    spotId: id,
    page,
    limit,
    total: count ?? null,
    photos,
  });
}
