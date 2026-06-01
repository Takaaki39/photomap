import { apiFetchSafe } from "@/shared/api/http";
import type { MyPhoto } from "../types";

export async function fetchMyPhotos(): Promise<{ photos: MyPhoto[] } | { error: string }> {
  const result = await apiFetchSafe<{ photos?: MyPhoto[] }>("/api/me/photos", {
    cache: "no-store",
  });
  if (!result.ok) return { error: result.error };
  return { photos: result.data.photos ?? [] };
}

export async function deletePhoto(photoId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await apiFetchSafe<unknown>(`/api/photos/${photoId}`, {
    method: "DELETE",
    parseJson: false,
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

const DEFAULT_CONCURRENCY = 6;

/** 複数写真を並列削除。失敗した ID の一覧を返す */
export async function bulkDeletePhotos(
  photoIds: string[],
  options?: {
    concurrency?: number;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<{ failedIds: string[] }> {
  const concurrency = options?.concurrency ?? DEFAULT_CONCURRENCY;
  const total = photoIds.length;
  const failures: string[] = [];
  let cursor = 0;
  let done = 0;

  const worker = async () => {
    while (cursor < photoIds.length) {
      const i = cursor;
      cursor += 1;
      const id = photoIds[i] as string;
      const result = await deletePhoto(id);
      if (!result.ok) failures.push(id);
      done += 1;
      options?.onProgress?.(done, total);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, photoIds.length) }, () => worker()),
  );

  return { failedIds: failures };
}
