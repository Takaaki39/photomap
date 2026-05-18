import { extractDateTakenFromExif } from "@/lib/exif";

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
}): Promise<UploadPhotoResult> {
  const takenAt = await extractDateTakenFromExif(params.file);

  const prepareRes = await fetch("/api/photos/upload/prepare", {
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
  });

  const prepareRaw = await prepareRes.text();
  const preparePayload = (() => {
    try {
      return JSON.parse(prepareRaw) as Record<string, unknown>;
    } catch {
      return { error: prepareRaw };
    }
  })();

  if (!prepareRes.ok) {
    const msg =
      (typeof preparePayload.error === "string" && preparePayload.error) ||
      "アップロードの準備に失敗しました。";
    throw new Error(msg);
  }

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

  const completeRes = await fetch("/api/photos/upload/complete", {
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
    }),
  });

  const completeRaw = await completeRes.text();
  const completePayload = (() => {
    try {
      return JSON.parse(completeRaw) as Record<string, unknown>;
    } catch {
      return { error: completeRaw };
    }
  })();

  if (!completeRes.ok) {
    const msg =
      (typeof completePayload.error === "string" && completePayload.error) ||
      "アップロードの登録に失敗しました。";
    throw new Error(msg);
  }

  return {
    spot_id: typeof completePayload.spot_id === "string" ? completePayload.spot_id : spotId,
    photo_id: typeof completePayload.photo_id === "string" ? completePayload.photo_id : "",
    lat: typeof completePayload.lat === "number" ? completePayload.lat : params.lat,
    lng: typeof completePayload.lng === "number" ? completePayload.lng : params.lng,
  };
}
