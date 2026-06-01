import { apiFetchSafe } from "@/shared/api/http";

export type ReverseGeocodeResult = {
  name: string;
} | null;

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  const result = await apiFetchSafe<{ result?: { name?: string } | null }>(
    `/api/geocode/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
    { cache: "no-store" },
  );
  if (!result.ok) return null;
  const name = typeof result.data.result?.name === "string" ? result.data.result.name.trim() : "";
  return name ? { name } : null;
}
