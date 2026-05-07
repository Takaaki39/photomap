import { createSupabaseAdminClient } from "@/lib/supabase";
import type { Database } from "@/types";

const SAME_SPOT_THRESHOLD_METERS = 50;

type SpotRow = {
  id: string;
  name: string;
  address: string | null;
  location_wkt: string | null;
};

function parsePointFromWkt(wkt: string | null): { lat: number; lng: number } | null {
  if (!wkt) return null;
  const match = wkt.match(/^POINT\(([-\d.]+)\s+([-\d.]+)\)$/);
  if (!match) return null;
  return { lng: Number(match[1]), lat: Number(match[2]) };
}

async function updateSpotCentroid(spot: SpotRow, lat: number, lng: number) {
  const current = parsePointFromWkt(spot.location_wkt);
  if (!current) return;

  const nextLat = (current.lat + lat) / 2;
  const nextLng = (current.lng + lng) / 2;
  const admin = createSupabaseAdminClient();

  const payload: Database["public"]["Tables"]["spots"]["Update"] = {
    location: `SRID=4326;POINT(${nextLng} ${nextLat})` as unknown,
  };

  const { error } = await admin
    .from("spots")
    .update(payload as unknown as never)
    .eq("id", spot.id);

  if (error) throw error;
}

export async function matchOrCreateSpot(lat: number, lng: number, placeName: string): Promise<string> {
  const admin = createSupabaseAdminClient();
  const normalizedPlaceName = placeName.trim();

  const rpcClient = admin as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };

  // Always prioritize proximity match over name match.
  // Relying on name alone (e.g. "不明なスポット") merges unrelated locations.
  const { data: nearby, error: nearbyError } = await rpcClient.rpc("find_nearby_spot", {
    lat,
    lng,
    radius_meters: SAME_SPOT_THRESHOLD_METERS,
  });
  if (nearbyError) throw nearbyError;

  const nearest = (nearby as { id: string }[] | null)?.[0];
  if (nearest?.id) {
    const { data: spotData, error: spotError } = await admin
      .from("spots_with_location")
      .select("id, name, address, location_wkt")
      .eq("id", nearest.id)
      .maybeSingle();
    if (spotError) throw spotError;
    if (spotData) {
      await updateSpotCentroid(spotData as SpotRow, lat, lng);
    }
    return nearest.id;
  }

  const insertPayload: Database["public"]["Tables"]["spots"]["Insert"] = {
    name: normalizedPlaceName || "不明なスポット",
    address: null,
    location: `SRID=4326;POINT(${lng} ${lat})` as unknown,
  };

  const { data: created, error: createError } = await admin
    .from("spots")
    .insert(insertPayload as unknown as never)
    .select("id")
    .single();

  if (createError) throw createError;
  return (created as { id: string }).id;
}
