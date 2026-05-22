import exifr from "exifr";

export type ExifGps = { lat: number; lng: number } | null;

function exifInput(file: File): Promise<ArrayBuffer> | File {
  return typeof FileReader === "undefined" ? file.arrayBuffer() : file;
}

/**
 * exifr が返す DateTimeOriginal を ISO 文字列に正規化する。
 * 通常は Date オブジェクトだが、稀に EXIF 文字列 ("YYYY:MM:DD HH:MM:SS") のまま返ることがあるので両対応。
 */
function normalizeExifDate(candidate: unknown): string | null {
  if (candidate instanceof Date) {
    return Number.isNaN(candidate.getTime()) ? null : candidate.toISOString();
  }
  if (typeof candidate === "string") {
    const m = candidate.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
    if (m) {
      const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
      const d = new Date(iso);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  }
  return null;
}

type ExifDateFields = {
  DateTimeOriginal?: unknown;
  CreateDate?: unknown;
  ModifyDate?: unknown;
};

function pickDateFromParsed(parsed: unknown): string | null {
  const p = (parsed ?? {}) as ExifDateFields;
  return (
    normalizeExifDate(p.DateTimeOriginal) ??
    normalizeExifDate(p.CreateDate) ??
    normalizeExifDate(p.ModifyDate)
  );
}

export async function extractDateTakenFromExif(file: File): Promise<string | null> {
  try {
    const input = await exifInput(file);
    const parsed = await exifr.parse(input as never, {
      pick: ["DateTimeOriginal", "CreateDate", "ModifyDate"],
    });
    return pickDateFromParsed(parsed);
  } catch {
    return null;
  }
}

/** サーバー側で Storage から取得したバッファから撮影日を抽出するフォールバック */
export async function extractDateTakenFromBuffer(buffer: Uint8Array): Promise<string | null> {
  try {
    const parsed = await exifr.parse(buffer as never, {
      pick: ["DateTimeOriginal", "CreateDate", "ModifyDate"],
    });
    return pickDateFromParsed(parsed);
  } catch {
    return null;
  }
}

export async function extractGpsFromExif(file: File): Promise<ExifGps> {
  // exifr can parse both browser File/Blob and Node buffers, but some paths
  // rely on FileReader which doesn't exist in the Node runtime.
  const input = await exifInput(file);

  const gps = await exifr.gps(input as never);
  if (typeof gps?.latitude !== "number" || typeof gps?.longitude !== "number") return null;

  return { lat: gps.latitude, lng: gps.longitude };
}
