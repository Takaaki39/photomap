"use client";

import type { PickedLocation } from "@/components/Map/PinPicker";

/** アップロード画面用: 地図は出さず、取得済み座標の表示のみ */
export function UploadMapCard({
  gps,
  manualLocation,
}: {
  gps: { lat: number; lng: number } | null;
  manualLocation: PickedLocation | null;
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-base shadow-md">
      <div className="px-2 py-1">
        <div className="text-label-sm font-label-sm text-primary uppercase">位置情報</div>
        <div className="text-body-md font-body-md font-bold">
          {gps
            ? `EXIF（${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}）`
            : manualLocation
              ? `手動（${manualLocation.lat.toFixed(4)}, ${manualLocation.lng.toFixed(4)}）`
              : "未設定"}
        </div>
      </div>
    </div>
  );
}
