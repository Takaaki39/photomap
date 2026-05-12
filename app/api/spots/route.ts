import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { createSupabaseAdminClient, supabase } from "@/lib/supabase";
import { createSignedPhotoUrl } from "@/lib/photoUrl";

type SpotRpcRow = {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
  lat: number;
  lng: number;
  location_wkt: string | null;
};

type SpotBaseRow = {
  id: string;
  name: string;
  address: string | null;
  location_wkt: string | null;
};

function parseBounds(bounds: string | null) {
  if (!bounds) return null;
  const parts = bounds.split(",").map((v) => Number(v.trim()));
  if (parts.length !== 4 || parts.some((v) => Number.isNaN(v))) return null;
  // client sends: south,west,north,east
  const [south, west, north, east] = parts;
  return { south, west, north, east };
}

function parsePointFromWkt(wkt: string | null) {
  if (!wkt) return null;
  const match = wkt.match(/^POINT\(([-\d.]+)\s+([-\d.]+)\)$/);
  if (!match) return null;
  return { lng: Number(match[1]), lat: Number(match[2]) };
}

export async function GET(request: Request) {
  // 未ログインユーザーにピン情報を返さない（プライベートサイト）
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bounds = parseBounds(searchParams.get("bounds"));
  const zoom = Number(searchParams.get("zoom") ?? 5);
  if (!bounds) {
    return NextResponse.json({ error: "invalid bounds. expected north,south,east,west" }, { status: 400 });
  }

  const client = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdminClient() : supabase;

  // Use RPC to avoid PostgREST spatial filter parsing pitfalls.
  const rpcClient = client as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
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

  const spotRows = (spotsData ?? []) as SpotRpcRow[];
  const spotIds = spotRows.map((spot) => spot.id);
  if (spotIds.length === 0) {
    return NextResponse.json({ zoom, spots: [] });
  }

  const { data: photosData, error: photosError } = await client
    .from("photos")
    .select("spot_id, storage_url, thumbnail_url, created_at")
    .in("spot_id", spotIds)
    .order("created_at", { ascending: false });
  if (photosError) {
    return NextResponse.json({ error: photosError.message }, { status: 500 });
  }
  const photos = (photosData ?? []) as {
    spot_id: string;
    storage_url: string;
    thumbnail_url: string | null;
    created_at: string;
  }[];

  const photoMap = new Map<
    string,
    { photo_count: number; thumbnail_url: string | null; storage_url: string | null }
  >();

  photos.forEach((photo) => {
    const current = photoMap.get(photo.spot_id);
    if (!current) {
      photoMap.set(photo.spot_id, {
        photo_count: 1,
        thumbnail_url: photo.thumbnail_url,
        storage_url: photo.storage_url,
      });
      return;
    }
    current.photo_count += 1;
  });

  const spots = await Promise.all(
    spotRows
    .map((spot) => {
      if (!Number.isFinite(spot.lat) || !Number.isFinite(spot.lng)) return null;
      const media = photoMap.get(spot.id);
      return {
        id: spot.id,
        name: spot.name,
        address: spot.address,
        lat: spot.lat,
        lng: spot.lng,
        photo_count: media?.photo_count ?? 0,
        thumbnail_url: media?.thumbnail_url ?? null,
        storage_url: media?.storage_url ?? null,
      };
    })
    .filter((spot): spot is NonNullable<typeof spot> => Boolean(spot))
    // Hide spots with no photos (prevents "empty" pins after deletions).
    .filter((spot) => spot.photo_count > 0)
    .map(async (spot) => {
      const signedThumb = await createSignedPhotoUrl(spot.thumbnail_url, 3600);
      const signedOriginal = await createSignedPhotoUrl(spot.storage_url, 3600);
      return {
        ...spot,
        thumbnail_url: signedThumb ?? signedOriginal,
      };
    })
  );

  // NOTE: We rely on Leaflet.markercluster on the client for clustering.
  // Returning synthetic `cluster:*` ids breaks gallery routing (expects UUID spot ids).
  return NextResponse.json({ zoom, spots });
}
