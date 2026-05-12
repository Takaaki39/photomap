import "server-only";

export type ReverseGeocodeResult = {
  name: string; // POI name (e.g. park/shrine/station)
  address: string;
} | null;

let lastRequestAt = 0;

async function waitForRateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
  }
  lastRequestAt = Date.now();
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  await waitForRateLimit();

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  const userAgent = process.env.NOMINATIM_USER_AGENT ?? "PhotoMap/1.0 (contact: admin@example.com)";

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": userAgent,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  const data = (await response.json()) as {
    name?: string;
    display_name?: string;
    namedetails?: { name?: string } | null;
    address?: Record<string, unknown> | null;
  };

  // Prefer a POI-like name over a full address.
  const addr = (data.address ?? {}) as Record<string, unknown>;
  const candidateKeys = [
    // Nominatim often provides these for POIs.
    "attraction",
    "tourism",
    "leisure",
    "amenity",
    "building",
    "historic",
    "natural",
    "shop",
    "railway",
    "aeroway",
    "man_made",
    // Fallbacks that are still place-ish.
    "neighbourhood",
    "suburb",
    "quarter",
    "village",
    "town",
    "city",
  ] as const;

  const poiFromAddress = candidateKeys
    .map((k) => addr[k])
    .find((v): v is string => typeof v === "string" && v.trim().length > 0);

  const name =
    (typeof data.name === "string" && data.name.trim() ? data.name.trim() : null) ??
    (typeof data.namedetails?.name === "string" && data.namedetails.name.trim() ? data.namedetails.name.trim() : null) ??
    (poiFromAddress ? poiFromAddress.trim() : null) ??
    (typeof data.display_name === "string" && data.display_name.trim() ? data.display_name.split(",")[0].trim() : null);

  if (!name || !data.display_name) return null;

  return {
    name,
    address: data.display_name,
  };
}
