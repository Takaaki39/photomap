import { useCallback, useEffect, useState } from "react";
import { bulkDeletePhotos, deletePhoto, fetchMyPhotos } from "../api/photosApi";
import { refreshAllSpotsSnapshot } from "@/features/map/store/spotsBoundsCache";
import type { MyPhoto } from "../types";

export function useMyPhotos() {
  const [photos, setPhotos] = useState<MyPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  const reload = useCallback(async () => {
    const result = await fetchMyPhotos();
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setError(null);
    setPhotos(result.photos);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const removePhoto = useCallback(async (photoId: string) => {
    if (!confirm("この写真を削除しますか？（クラウド上の画像も削除されます）")) return false;
    const result = await deletePhoto(photoId);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    void refreshAllSpotsSnapshot();
    return true;
  }, []);

  const removeAllPhotos = useCallback(async () => {
    if (bulkDeleting) return false;
    const total = photos.length;
    if (total === 0) return false;
    const ok = confirm(
      `自分の写真 ${total} 枚をすべて削除します。\n` +
        "クラウド上の画像も削除され、元に戻せません。\n本当に実行しますか？",
    );
    if (!ok) return false;

    setBulkDeleting(true);
    setBulkProgress({ done: 0, total });
    setError(null);

    const ids = photos.map((p) => p.id);
    const { failedIds } = await bulkDeletePhotos(ids, {
      onProgress: (done, t) => setBulkProgress({ done, total: t }),
    });

    const succeededIds = new Set(ids.filter((id) => !failedIds.includes(id)));
    setPhotos((prev) => prev.filter((p) => !succeededIds.has(p.id)));
    setBulkDeleting(false);
    setBulkProgress(null);

    if (failedIds.length > 0) {
      setError(`${failedIds.length} 件の削除に失敗しました。再度お試しください。`);
    }
    void refreshAllSpotsSnapshot();
    return failedIds.length === 0;
  }, [bulkDeleting, photos]);

  return {
    photos,
    error,
    setError,
    reload,
    removePhoto,
    removeAllPhotos,
    bulkDeleting,
    bulkProgress,
  };
}
