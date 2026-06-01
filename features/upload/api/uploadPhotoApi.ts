import { extractDateTakenFromExif } from "@/lib/exif";
import { apiFetch } from "@/shared/api/http";

export type UploadPhotoResult = {
  spot_id: string;
  photo_id: string;
  lat?: number;
  lng?: number;
};

/** Vercel 関数を経由せず Storage へ直接 PUT してから DB 登録 */
export async function uploadPhotoViaStorage(params: {
  file: File;
  lat: number;
  lng: number;
  placeName: string;
  isPublic: boolean;
  /** 写真タグ（ビルトイン slug またはユーザーの任意文字列）。null は未タグ */
  tag: string | null;
}): Promise<UploadPhotoResult> {
  const takenAt = await extractDateTakenFromExif(params.file);

  const { data: preparePayload } = await apiFetch<Record<string, unknown>>(
    "/api/photos/upload/prepare",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: params.file.name,
        contentType: params.file.type || "image/jpeg",
        fileSize: params.file.size,
        lat: params.lat,
        lng: params.lng,
        place_name: params.placeName,
      }),
    },
  );

  const signedUrl = String(preparePayload.signed_url ?? "");
  const storagePath = String(preparePayload.storage_path ?? "");
  const spotId = String(preparePayload.spot_id ?? "");
  const contentType = String(preparePayload.content_type ?? params.file.type ?? "image/jpeg");

  if (!signedUrl || !storagePath || !spotId) {
    throw new Error("アップロード URL の取得に失敗しました。");
  }

  const putRes = await fetch(signedUrl, {
    method: "PUT",
    body: params.file,
    headers: { "Content-Type": contentType },
  });

  if (!putRes.ok) {
    throw new Error(`ストレージへのアップロードに失敗しました（${putRes.status}）`);
  }

  const { data: completePayload } = await apiFetch<Record<string, unknown>>(
    "/api/photos/upload/complete",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storage_path: storagePath,
        spot_id: spotId,
        lat: params.lat,
        lng: params.lng,
        is_public: params.isPublic,
        taken_at: takenAt,
        content_type: contentType,
        tag: params.tag,
      }),
    },
  );

  return {
    spot_id: typeof completePayload.spot_id === "string" ? completePayload.spot_id : spotId,
    photo_id: typeof completePayload.photo_id === "string" ? completePayload.photo_id : "",
    lat: typeof completePayload.lat === "number" ? completePayload.lat : params.lat,
    lng: typeof completePayload.lng === "number" ? completePayload.lng : params.lng,
  };
}
