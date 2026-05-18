import { NextResponse } from "next/server";
import sharp from "sharp";
import { getServerAuthSession } from "@/lib/auth";
import { extractDateTakenFromExif, extractGpsFromExif } from "@/lib/exif";
import { reverseGeocode } from "@/lib/geocode";
import { matchOrCreateSpot } from "@/lib/spotMatcher";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { createSignedPhotoUrl } from "@/lib/photoUrl";
import type { Database } from "@/types";

function toErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (typeof e === "object" && e) {
    const anyE = e as { message?: unknown; error_description?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [
      typeof anyE.message === "string" ? anyE.message : null,
      typeof anyE.error_description === "string" ? anyE.error_description : null,
      typeof anyE.details === "string" ? anyE.details : null,
      typeof anyE.hint === "string" ? `hint: ${anyE.hint}` : null,
      typeof anyE.code === "string" ? `code: ${anyE.code}` : null,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(" / ");
    try {
      return JSON.stringify(e);
    } catch {
      return "unknown error";
    }
  }
  return "unknown error";
}

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.-]/g, "_");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function stableUuidFromString(input: string) {
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

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const fallbackAppUserId = isUuid(session.user.id)
      ? session.user.id
      : await stableUuidFromString(`ext:${session.user.id}`);

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "フォームデータの解析に失敗しました。" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "画像ファイルを指定してください" }, { status: 400 });
    }

    // Vercel Serverless: リクエスト本体は約 4.5MB 上限（FUNCTION_PAYLOAD_TOO_LARGE）
    const VERCEL_MAX_BODY = 4.5 * 1024 * 1024;
    if (file.size > VERCEL_MAX_BODY) {
      return NextResponse.json(
        {
          error:
            "画像が大きすぎてサーバーに届きませんでした。アプリを最新に更新するか、Storage 直接アップロード（/api/photos/upload/prepare）を利用してください。",
        },
        { status: 413 },
      );
    }

    const manualLatRaw = formData.get("manual_lat");
    const manualLngRaw = formData.get("manual_lng");
    const manualLat = typeof manualLatRaw === "string" ? Number(manualLatRaw) : null;
    const manualLng = typeof manualLngRaw === "string" ? Number(manualLngRaw) : null;

    const clientLatRaw = formData.get("client_lat");
    const clientLngRaw = formData.get("client_lng");
    const clientLat = typeof clientLatRaw === "string" ? Number(clientLatRaw) : null;
    const clientLng = typeof clientLngRaw === "string" ? Number(clientLngRaw) : null;

    const requireExifGps = String(formData.get("require_exif_gps") ?? "false") === "true";

    const clientGps =
      typeof clientLat === "number" &&
      typeof clientLng === "number" &&
      Number.isFinite(clientLat) &&
      Number.isFinite(clientLng)
        ? { lat: clientLat, lng: clientLng }
        : null;

    const exifGps = await extractGpsFromExif(file);
    if (requireExifGps && !exifGps) {
      return NextResponse.json({ error: "位置情報（EXIF）が無い写真はアップロードできません。" }, { status: 422 });
    }

    const gps = requireExifGps
      ? exifGps
      : (clientGps ??
        exifGps ??
        (typeof manualLat === "number" &&
        typeof manualLng === "number" &&
        Number.isFinite(manualLat) &&
        Number.isFinite(manualLng)
          ? { lat: manualLat, lng: manualLng }
          : null));

    if (!gps) {
      return NextResponse.json({ error: "手動で場所を入力してください" }, { status: 422 });
    }

    const geocode = await reverseGeocode(gps.lat, gps.lng);
    const manualPlaceName = String(formData.get("place_name") ?? "").trim();
    const placeName = geocode?.name ?? (manualPlaceName || "不明なスポット");
    const spotId = await matchOrCreateSpot(gps.lat, gps.lng, placeName);

    const takenAtFromExif = await extractDateTakenFromExif(file);

    const fileBuffer = new Uint8Array(await file.arrayBuffer());
    let sanitizedBuffer: Uint8Array = fileBuffer;
    try {
      // Re-encode to strip metadata (including EXIF GPS tags).
      sanitizedBuffer = new Uint8Array(await sharp(fileBuffer).rotate().toBuffer());
    } catch {
      sanitizedBuffer = fileBuffer;
    }

    let admin: ReturnType<typeof createSupabaseAdminClient>;
    try {
      admin = createSupabaseAdminClient();
    } catch (e) {
      return NextResponse.json({ error: `Supabase 設定の読み込みに失敗しました。${toErrorMessage(e)}` }, { status: 500 });
    }

    // Ensure the referenced public.users row exists (photos.user_id FK).
    // Use email as the stable lookup key to avoid UUID mismatch across providers/sessions.
    if (!session.user.email) {
      return NextResponse.json({ error: "ユーザー情報（email）が取得できませんでした。" }, { status: 400 });
    }

    const { data: existingUser, error: existingUserError } = await admin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .maybeSingle();
    if (existingUserError) {
      return NextResponse.json({ error: existingUserError.message }, { status: 500 });
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
        { onConflict: "id" }
      );
      if (upsertUserError) {
        return NextResponse.json({ error: upsertUserError.message }, { status: 500 });
      }
    }

    const path = `${appUserId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;

    const { error: uploadError } = await admin.storage.from("photos").upload(path, sanitizedBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const isPublic = String(formData.get("is_public") ?? "true") === "true";
    const takenAtRaw = formData.get("taken_at");
    const takenAtFromForm = typeof takenAtRaw === "string" && takenAtRaw ? takenAtRaw : null;
    const takenAt =
      takenAtFromForm ??
      takenAtFromExif ??
      (Number.isFinite(file.lastModified) ? new Date(file.lastModified).toISOString() : null);
    const insertPayload: Database["public"]["Tables"]["photos"]["Insert"] = {
      user_id: appUserId,
      spot_id: spotId,
      storage_url: path,
      thumbnail_url: null,
      is_public: isPublic,
      taken_at: takenAt,
      exif_lat: gps.lat,
      exif_lng: gps.lng,
    };

    const { data: photo, error: photoError } = await admin
      .from("photos")
      .insert(insertPayload as unknown as never)
      .select("id")
      .single();

    if (photoError) {
      return NextResponse.json({ error: photoError.message }, { status: 500 });
    }

    const photoId = (photo as { id: string }).id;
    const imageUrl = await createSignedPhotoUrl(path, 3600);

    return NextResponse.json({
      spot_id: spotId,
      photo_id: photoId,
      image_url: imageUrl,
      lat: gps.lat,
      lng: gps.lng,
      geocode,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: toErrorMessage(e) }, { status: 500 });
  }
}
