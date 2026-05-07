import "server-only";

export type ReverseGeocodeResult = {
  name: string;
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
  };

  const name = data.name ?? data.display_name;
  if (!name || !data.display_name) return null;

  return {
    name,
    address: data.display_name,
  };
}
