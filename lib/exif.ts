import exifr from "exifr";

export type ExifGps = { lat: number; lng: number } | null;

function exifInput(file: File): Promise<ArrayBuffer> | File {
  return typeof FileReader === "undefined" ? file.arrayBuffer() : file;
}

export async function extractDateTakenFromExif(file: File): Promise<string | null> {
  try {
    const input = await exifInput(file);
    const parsed = await exifr.parse(input as never, {
      pick: ["DateTimeOriginal", "CreateDate", "ModifyDate"],
    });
    const candidate =
      (parsed as { DateTimeOriginal?: Date; CreateDate?: Date; ModifyDate?: Date } | undefined)
        ?.DateTimeOriginal ??
      (parsed as { CreateDate?: Date })?.CreateDate ??
      (parsed as { ModifyDate?: Date })?.ModifyDate;
    if (candidate instanceof Date && !Number.isNaN(candidate.getTime())) {
      return candidate.toISOString();
    }
  } catch {
    // ignore
  }
  return null;
}

export async function extractGpsFromExif(file: File): Promise<ExifGps> {
  // exifr can parse both browser File/Blob and Node buffers, but some paths
  // rely on FileReader which doesn't exist in the Node runtime.
  const input = await exifInput(file);

  const gps = await exifr.gps(input as never);
  if (typeof gps?.latitude !== "number" || typeof gps?.longitude !== "number") return null;

  return { lat: gps.latitude, lng: gps.longitude };
}
