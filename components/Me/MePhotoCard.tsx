"use client";

import AdBanner from "@/components/AdBanner";
import type { MyPhoto } from "./types";

export function MePhotoCard({
  photo,
  showAd,
  onToggleVisibility,
  onRemove,
}: {
  photo: MyPhoto;
  showAd: boolean;
  onToggleVisibility: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-4">
      {showAd ? (
        <div className="rounded-lg border p-3">
          <p className="mb-2 text-xs text-outline">広告</p>
          <AdBanner />
        </div>
      ) : null}

      <article className="overflow-hidden rounded-lg border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.image_url} alt={`投稿画像: ${photo.spot_name || "スポット未設定"}`} className="h-52 w-full object-cover" />
        <div className="space-y-2 p-3 text-sm">
          <p className="font-medium">{photo.spot_name || "スポット未設定"}</p>
          <p className="text-xs text-outline">{new Date(photo.created_at).toLocaleString("ja-JP")}</p>
          <div className="flex gap-2">
            <button type="button" onClick={onToggleVisibility} className="rounded border px-2 py-1 text-xs hover:bg-surface-container">
              {photo.is_public ? "非公開にする" : "公開にする"}
            </button>
            <button type="button" onClick={onRemove} className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50">
              削除
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

