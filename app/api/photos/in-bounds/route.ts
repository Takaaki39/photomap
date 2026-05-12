import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { createSupabaseAdminClient, supabase } from "@/lib/supabase";
import { createSignedPhotoUrl } from "@/lib/photoUrl";

function parseBounds(bounds: string | null) {
  if (!bounds) return null;
  const parts = bounds.split(",").map((v) => Number(v.trim()));
  if (parts.length !== 4 || parts.some((v) => Number.isNaN(v))) return null;
  // client sends: south,west,north,east
  const [south, west, north, east] = parts;
  return { south, west, north, east };
}

export async function GET(request: Request) {
  // 未ログインユーザーには写真情報を返さない（プライベートサイト）
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bounds = parseBounds(searchParams.get("bounds"));
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? 60)));
  if (!bounds) {
    return NextResponse.json({ error: "invalid bounds" }, { status: 400 });
  }

  const client = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdminClient() : supabase;
  const rpcClient = client as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  };

  const { data: spotsData, error: spotsError } = await rpcClient.rpc("get_spots_in_bounds", {
    south: bounds.south,
    west: bounds.west,
    north: bounds.north,
    east: bounds.east,
  });
  if (spotsError) {
    return NextResponse.json({ error: spotsError.message }, { status: 500 });
  }

  const spotIds = ((spotsData ?? []) as { id: string }[]).map((s) => s.id);
  if (spotIds.length === 0) {
    return NextResponse.json({ photos: [], total: 0 });
  }

  const { data, error } = await client
    .from("photos")
    .select("id, spot_id, storage_url, thumbnail_url, created_at")
    .in("spot_id", spotIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as {
    id: string;
    spot_id: string;
    storage_url: string;
    thumbnail_url: string | null;
    created_at: string;
  }[];

  const photos = await Promise.all(
    rows.map(async (row) => {
      const signedThumb = await createSignedPhotoUrl(row.thumbnail_url, 3600);
      const signedOriginal = await createSignedPhotoUrl(row.storage_url, 3600);
      return {
        id: row.id,
        spot_id: row.spot_id,
        image_url: signedThumb ?? signedOriginal,
        created_at: row.created_at,
      };
    }),
  );

  return NextResponse.json({ photos, total: photos.length });
}

