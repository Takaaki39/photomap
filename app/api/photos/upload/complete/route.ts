import { NextResponse } from "next/server";
import { isPhotoTag } from "@/lib/photoTag";
import { createSignedPhotoUrl } from "@/lib/photoUrl";
import {
  insertPhotoRow,
  requireUploadSession,
  stripExifAndReupload,
} from "@/lib/photoUploadServer";

/** Storage へ直接 PUT 済みの画像を登録（JSON のみ） */
export async function POST(request: Request) {
  try {
    const auth = await requireUploadSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as {
      storage_path?: string;
      spot_id?: string;
      lat?: number;
      lng?: number;
      is_public?: boolean;
      taken_at?: string | null;
      content_type?: string;
      tag?: string | null;
    };

    const storagePath = String(body.storage_path ?? "");
    const spotId = String(body.spot_id ?? "");
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const contentType = String(body.content_type ?? "image/jpeg");

    if (!storagePath.startsWith(`${auth.appUserId}/`)) {
      return NextResponse.json({ error: "無効なストレージパスです。" }, { status: 403 });
    }
    if (!spotId) {
      return NextResponse.json({ error: "スポット ID が不足しています。" }, { status: 400 });
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "位置情報が不足しています。" }, { status: 422 });
    }

    const stripped = await stripExifAndReupload(storagePath, contentType);
    if ("error" in stripped) {
      return NextResponse.json({ error: stripped.error }, { status: 500 });
    }

    const isPublic = body.is_public !== false;
    // 撮影日: クライアント抽出を優先し、無ければサーバー側で EXIF から抽出したものをフォールバック
    const clientTakenAt =
      typeof body.taken_at === "string" && body.taken_at ? body.taken_at : null;
    const takenAt = clientTakenAt ?? stripped.takenAt ?? null;
    // タグ: 未指定または不正値は null（未タグ）として扱う
    const tag = isPhotoTag(body.tag) ? body.tag : null;

    const inserted = await insertPhotoRow({
      user_id: auth.appUserId,
      spot_id: spotId,
      storage_url: storagePath,
      thumbnail_url: null,
      is_public: isPublic,
      taken_at: takenAt,
      exif_lat: lat,
      exif_lng: lng,
      tag,
    });

    if ("error" in inserted) {
      return NextResponse.json({ error: inserted.error }, { status: 500 });
    }

    const imageUrl = await createSignedPhotoUrl(storagePath, 3600);

    return NextResponse.json({
      spot_id: spotId,
      photo_id: inserted.photoId,
      image_url: imageUrl,
      lat,
      lng,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "アップロードの登録に失敗しました。" }, { status: 500 });
  }
}
