import { NextResponse } from "next/server";
import {
  MAX_UPLOAD_BYTES,
  prepareSpotForUpload,
  requireUploadSession,
  sanitizeFileName,
} from "@/lib/photoUploadServer";

/** 署名付き URL を発行（リクエスト本体は JSON のみ → Vercel の 4.5MB 制限を回避） */
export async function POST(request: Request) {
  try {
    const auth = await requireUploadSession();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as {
      fileName?: string;
      contentType?: string;
      fileSize?: number;
      lat?: number;
      lng?: number;
      place_name?: string;
    };

    const fileName = String(body.fileName ?? "photo.jpg");
    const contentType = String(body.contentType ?? "image/jpeg");
    const fileSize = Number(body.fileSize ?? 0);
    const lat = Number(body.lat);
    const lng = Number(body.lng);

    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json({ error: "ファイルサイズが不正です。" }, { status: 400 });
    }
    if (fileSize > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `ファイルサイズが大きすぎます（最大${MAX_UPLOAD_BYTES / (1024 * 1024)}MB）。` },
        { status: 413 },
      );
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "位置情報が不足しています。" }, { status: 422 });
    }

    const { spotId, geocode } = await prepareSpotForUpload({
      lat,
      lng,
      placeName: body.place_name,
    });

    const storagePath = `${auth.appUserId}/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;

    const { data: signed, error: signError } = await auth.admin.storage
      .from("photos")
      .createSignedUploadUrl(storagePath);

    if (signError || !signed?.signedUrl) {
      return NextResponse.json(
        { error: signError?.message ?? "アップロード URL の発行に失敗しました。" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      storage_path: storagePath,
      signed_url: signed.signedUrl,
      token: signed.token,
      spot_id: spotId,
      geocode,
      content_type: contentType,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "アップロードの準備に失敗しました。" }, { status: 500 });
  }
}
