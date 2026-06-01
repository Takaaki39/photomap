import { useCallback } from "react";
import { deleteGalleryPhoto } from "../api/galleryApi";
import { refreshAllSpotsSnapshot } from "@/features/map/store/spotsBoundsCache";

const DELETE_CONFIRM =
  "この写真を削除しますか？（クラウド上の画像も削除されます）";

/**
 * ギャラリー系画面で共通利用する写真削除ハンドラ。
 */
export function useDeleteGalleryPhoto(options?: {
  onError?: (message: string) => void;
  confirmMessage?: string;
}) {
  const confirmMessage = options?.confirmMessage ?? DELETE_CONFIRM;

  const deleteWithConfirm = useCallback(
    async (photoId: string): Promise<boolean> => {
      if (!confirm(confirmMessage)) return false;
      const result = await deleteGalleryPhoto(photoId);
      if (!result.ok) {
        options?.onError?.(result.error);
        return false;
      }
      void refreshAllSpotsSnapshot();
      return true;
    },
    [confirmMessage, options],
  );

  return deleteWithConfirm;
}
