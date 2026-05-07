import { createSupabaseAdminClient } from "@/lib/supabase";

function storagePublicUrl(path: string) {
  const raw = process.env.SUPABASE_URL;
  if (!raw) return null;
  const base = raw.replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "");
  const encoded = path
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `${base}/storage/v1/object/public/photos/${encoded}`;
}

function extractStoragePath(input: string): string {
  // Accept either a raw storage path ("<user>/<file>.jpg") or a Supabase Storage URL.
  // Examples we try to normalize:
  // - https://<ref>.supabase.co/storage/v1/object/public/photos/<path>
  // - https://<ref>.supabase.co/storage/v1/object/sign/photos/<path>?token=...
  // - photos/<path>
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^\/+/, "").replace(/^photos\//i, "");
  }

  try {
    const u = new URL(trimmed);
    // Find ".../object/(public|sign)/photos/<path>"
    const parts = u.pathname.split("/").filter(Boolean);
    const photosIdx = parts.findIndex((p) => p.toLowerCase() === "photos");
    if (photosIdx >= 0 && photosIdx + 1 < parts.length) {
      const rest = parts.slice(photosIdx + 1).join("/");
      return decodeURIComponent(rest);
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

export async function createSignedPhotoUrl(path: string | null, expiresInSec = 60 * 60): Promise<string | null> {
  if (!path) return null;
  const normalized = extractStoragePath(path);
  if (!normalized) return null;

  // If it still looks like a URL but we couldn't parse it, just return as-is.
  // This prevents breaking already-valid URLs stored in DB.
  if (/^https?:\/\//i.test(normalized)) return normalized;

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage.from("photos").createSignedUrl(normalized, expiresInSec);
    if (!error) return data.signedUrl;
  } catch {
    // ignore
  }

  // Fallback: if the bucket is public (or policies allow), use the public URL.
  return storagePublicUrl(normalized);
}
