import exifr from "exifr";

export type ExifGps = { lat: number; lng: number } | null;

export async function extractGpsFromExif(file: File): Promise<ExifGps> {
  // exifr can parse both browser File/Blob and Node buffers, but some paths
  // rely on FileReader which doesn't exist in the Node runtime.
  const input: unknown =
    typeof FileReader === "undefined" ? await file.arrayBuffer() : file;

  const gps = await exifr.gps(input as never);
  if (typeof gps?.latitude !== "number" || typeof gps?.longitude !== "number") return null;

  return { lat: gps.latitude, lng: gps.longitude };
}
