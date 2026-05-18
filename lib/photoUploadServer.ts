import sharp from "sharp";
import { getServerAuthSession } from "@/lib/auth";
import { reverseGeocode } from "@/lib/geocode";
import { matchOrCreateSpot } from "@/lib/spotMatcher";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type { Database } from "@/types";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export function sanitizeFileName(name: string) {
  return name.replace(/[^\w.-]/g, "_");
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function stableUuidFromString(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest).subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export async function resolveAppUserId(session: {
  user: { id?: string; email?: string | null; name?: string | null; image?: string | null };
}) {
  const fallbackAppUserId =
    session.user.id && isUuid(session.user.id)
      ? session.user.id
      : await stableUuidFromString(`ext:${session.user.id ?? session.user.email ?? "anon"}`);

  if (!session.user.email) {
    return { error: "ユーザー情報（email）が取得できませんでした。" as const };
  }

  const admin = createSupabaseAdminClient();
  const { data: existingUser, error: existingUserError } = await admin
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .maybeSingle();

  if (existingUserError) {
    return { error: existingUserError.message };
  }

  const appUserId = (existingUser as { id: string } | null)?.id ?? fallbackAppUserId;

  if (!existingUser) {
    const { error: upsertUserError } = await admin.from("users").upsert(
      {
        id: appUserId,
        email: session.user.email,
        display_name: session.user.name ?? null,
        avatar_url: session.user.image ?? null,
      } as unknown as never,
      { onConflict: "id" },
    );
    if (upsertUserError) {
      return { error: upsertUserError.message };
    }
  }

  return { appUserId, admin };
}

export async function requireUploadSession() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { error: "認証が必要です", status: 401 as const };
  }
  const resolved = await resolveAppUserId(session);
  if ("error" in resolved) {
    return { error: resolved.error, status: 400 as const };
  }
  return { session, ...resolved };
}

export async function prepareSpotForUpload(params: {
  lat: number;
  lng: number;
  placeName?: string;
}) {
  const geocode = await reverseGeocode(params.lat, params.lng);
  const placeName = geocode?.name ?? (params.placeName?.trim() || "不明なスポット");
  const spotId = await matchOrCreateSpot(params.lat, params.lng, placeName);
  return { spotId, geocode, placeName };
}

export async function stripExifAndReupload(storagePath: string, contentType: string) {
  const admin = createSupabaseAdminClient();
  const { data: blob, error: downloadError } = await admin.storage.from("photos").download(storagePath);
  if (downloadError || !blob) {
    return { error: downloadError?.message ?? "ストレージから画像を取得できませんでした。" };
  }

  const fileBuffer = new Uint8Array(await blob.arrayBuffer());
  let sanitizedBuffer: Uint8Array = fileBuffer;
  try {
    sanitizedBuffer = new Uint8Array(await sharp(fileBuffer).rotate().toBuffer());
  } catch {
    sanitizedBuffer = fileBuffer;
  }

  const { error: uploadError } = await admin.storage.from("photos").upload(storagePath, sanitizedBuffer, {
    contentType: contentType || "application/octet-stream",
    upsert: true,
  });

  if (uploadError) {
    return { error: uploadError.message };
  }

  return { ok: true as const };
}

export async function insertPhotoRow(payload: Database["public"]["Tables"]["photos"]["Insert"]) {
  const admin = createSupabaseAdminClient();
  const { data: photo, error: photoError } = await admin
    .from("photos")
    .insert(payload as unknown as never)
    .select("id")
    .single();

  if (photoError) {
    return { error: photoError.message };
  }

  return { photoId: (photo as { id: string }).id };
}
