"use client";

/** アップロード画面用: 取得済み EXIF 座標の表示のみ */
export function UploadLocationCard({ gps }: { gps: { lat: number; lng: number } | null }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-base shadow-md">
      <div className="px-2 py-1">
        <div className="text-label-sm font-label-sm text-primary uppercase">位置情報</div>
        <div className="text-body-md font-body-md font-bold">
          {gps ? `EXIF（${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}）` : "未設定"}
        </div>
      </div>
    </div>
  );
}
