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

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "invalid spot id" }, { status: 400 });
  }
  const session = await getServerAuthSession();
  const client = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdminClient() : supabase;

  const { data, error } = await client
    .from("spots_with_location")
    .select("id, name, address, location_wkt, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "spot not found" }, { status: 404 });
  }

  const wkt = (data as { location_wkt: string | null }).location_wkt;
  const match = wkt?.match(/^POINT\(([-\d.]+)\s+([-\d.]+)\)$/);
  const lng = match ? Number(match[1]) : null;
  const lat = match ? Number(match[2]) : null;

  const { data: photosData, error: photosError } = await client
    .from("photos")
    .select("id, user_id, spot_id, storage_url, thumbnail_url, is_public, created_at, users(display_name)")
    .eq("spot_id", id)
    .order("created_at", { ascending: false });
  if (photosError) {
    return NextResponse.json({ error: photosError.message }, { status: 500 });
  }

  const viewerId = session?.user?.id;
  const rows = (photosData ?? []) as unknown as SpotPhotoRow[];
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
    spot: {
      id: (data as { id: string }).id,
      name: (data as { name: string }).name,
      address: (data as { address: string | null }).address,
      lat,
      lng,
      created_at: (data as { created_at: string }).created_at,
    },
    photos,
  });
}
