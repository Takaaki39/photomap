import "server-only";

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

export type SpotMapDto = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  photo_count: number;
  latest_photo_at: string | null;
  tags: string[];
  thumbnail_url: string | null;
};

export function parseBounds(bounds: string | null) {
  if (!bounds) return null;
  const parts = bounds.split(",").map((v) => Number(v.trim()));
  if (parts.length !== 4 || parts.some((v) => Number.isNaN(v))) return null;
  const [south, west, north, east] = parts;
  return { south, west, north, east };
}

export async function listSpotsInBounds(
  bounds: { south: number; west: number; north: number; east: number },
  zoom: number,
): Promise<{ zoom: number; spots: SpotMapDto[] }> {
  const client = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdminClient() : supabase;

  const rpcClient = client as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };

  const { data: spotsData, error: spotsError } = await rpcClient.rpc("get_spots_in_bounds", {
    south: bounds.south,
    west: bounds.west,
    north: bounds.north,
    east: bounds.east,
  });
  if (spotsError) throw new Error(spotsError.message);

  const spotRows = (spotsData ?? []) as SpotRpcRow[];
  const spotIds = spotRows.map((spot) => spot.id);
  if (spotIds.length === 0) {
    return { zoom, spots: [] };
  }

  const { data: photosData, error: photosError } = await client
    .from("photos")
    .select("spot_id, storage_url, thumbnail_url, taken_at, created_at, tag")
    .in("spot_id", spotIds)
    .order("created_at", { ascending: false });
  if (photosError) throw new Error(photosError.message);

  const photos = (photosData ?? []) as {
    spot_id: string;
    storage_url: string;
    thumbnail_url: string | null;
    taken_at: string | null;
    created_at: string;
    tag: string | null;
  }[];

  const photoMap = new Map<
    string,
    {
      photo_count: number;
      thumbnail_url: string | null;
      storage_url: string | null;
      latest_photo_at: string | null;
      tags: Set<string>;
    }
  >();

  photos.forEach((photo) => {
    const photoDate = photo.taken_at ?? photo.created_at;
    const current = photoMap.get(photo.spot_id);
    if (!current) {
      const tags = new Set<string>();
      if (photo.tag) tags.add(photo.tag);
      photoMap.set(photo.spot_id, {
        photo_count: 1,
        thumbnail_url: photo.thumbnail_url,
        storage_url: photo.storage_url,
        latest_photo_at: photoDate,
        tags,
      });
      return;
    }
    current.photo_count += 1;
    if (photo.tag) current.tags.add(photo.tag);
    if (current.latest_photo_at) {
      const currentTs = new Date(current.latest_photo_at).getTime();
      const newTs = new Date(photoDate).getTime();
      if (Number.isFinite(newTs) && (!Number.isFinite(currentTs) || newTs > currentTs)) {
        current.latest_photo_at = photoDate;
      }
    } else {
      current.latest_photo_at = photoDate;
    }
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
          latest_photo_at: media?.latest_photo_at ?? null,
          tags: media ? Array.from(media.tags) : [],
        };
      })
      .filter((spot): spot is NonNullable<typeof spot> => Boolean(spot))
      .filter((spot) => spot.photo_count > 0)
      .map(async (spot) => {
        const signedThumb = await createSignedPhotoUrl(spot.thumbnail_url, 3600);
        const signedOriginal = await createSignedPhotoUrl(spot.storage_url, 3600);
        return {
          id: spot.id,
          name: spot.name,
          address: spot.address,
          lat: spot.lat,
          lng: spot.lng,
          photo_count: spot.photo_count,
          latest_photo_at: spot.latest_photo_at,
          tags: spot.tags,
          thumbnail_url: signedThumb ?? signedOriginal,
        };
      }),
  );

  return { zoom, spots };
}
