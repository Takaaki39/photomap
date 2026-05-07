import { createClient } from "@supabase/supabase-js";
import type { Database, MapBounds, Photo, Spot } from "@/types";

function normalizeSupabaseUrl(raw: string) {
  // supabase-js expects the project base URL: https://<project-ref>.supabase.co
  // People often paste REST URL like https://<ref>.supabase.co/rest/v1/
  try {
    const u = new URL(raw);
    u.pathname = "";
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return raw.replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "");
  }
}

const supabaseUrl = process.env.SUPABASE_URL ? normalizeSupabaseUrl(process.env.SUPABASE_URL) : undefined;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export function createSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function parsePointFromWkt(wkt: string | null): { latitude: number | null; longitude: number | null } {
  if (!wkt) return { latitude: null, longitude: null };
  const match = wkt.match(/^POINT\(([-\d.]+)\s+([-\d.]+)\)$/);
  if (!match) return { latitude: null, longitude: null };
  return {
    longitude: Number(match[1]),
    latitude: Number(match[2]),
  };
}

function mapSpotRow(row: {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
  location_wkt: string | null;
}): Spot {
  const { latitude, longitude } = parsePointFromWkt(row.location_wkt);
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    createdAt: row.created_at,
    latitude,
    longitude,
  };
}

export async function getSpotsInBounds(bounds: MapBounds): Promise<Spot[]> {
  const { data, error } = await supabase
    .from("spots_with_location")
    .select("id, name, address, created_at, location_wkt")
    .filter(
      "location",
      "st_intersects",
      `SRID=4326;POLYGON((${bounds.west} ${bounds.south}, ${bounds.east} ${bounds.south}, ${bounds.east} ${bounds.north}, ${bounds.west} ${bounds.north}, ${bounds.west} ${bounds.south}))`
    );

  if (error) throw error;
  const rows = (data ?? []) as {
    id: string;
    name: string;
    address: string | null;
    created_at: string;
    location_wkt: string | null;
  }[];
  return rows.map(mapSpotRow);
}

export async function getSpotById(id: string): Promise<Spot | null> {
  const { data, error } = await supabase
    .from("spots_with_location")
    .select("id, name, address, created_at, location_wkt")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapSpotRow(
    data as {
      id: string;
      name: string;
      address: string | null;
      created_at: string;
      location_wkt: string | null;
    }
  );
}

export async function getPhotosBySpotId(spotId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from("photos")
    .select("id, user_id, spot_id, storage_url, thumbnail_url, is_public, taken_at, created_at, exif_lat, exif_lng")
    .eq("spot_id", spotId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as Database["public"]["Tables"]["photos"]["Row"][];
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    spotId: row.spot_id,
    storageUrl: row.storage_url,
    thumbnailUrl: row.thumbnail_url,
    isPublic: row.is_public,
    takenAt: row.taken_at,
    createdAt: row.created_at,
    exifLat: row.exif_lat,
    exifLng: row.exif_lng,
  }));
}

export async function findNearbySpot(lat: number, lng: number): Promise<Spot | null> {
  const rpcClient = supabase as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };

  const { data, error } = await rpcClient.rpc("find_nearby_spot", {
    lat,
    lng,
    radius_meters: 50,
  });

  if (error) throw error;
  const row = (data as Database["public"]["Functions"]["find_nearby_spot"]["Returns"] | null)?.[0];
  if (!row) return null;

  const { data: spotRow, error: spotError } = await supabase
    .from("spots_with_location")
    .select("id, name, address, created_at, location_wkt")
    .eq("id", row.id)
    .maybeSingle();

  if (spotError) throw spotError;
  if (!spotRow) return null;
  return mapSpotRow(spotRow);
}
