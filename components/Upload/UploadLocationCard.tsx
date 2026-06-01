"use client";

/** アップロード画面用: 取得済み EXIF 座標の表示のみ */
export function UploadLocationCard({ gps }: { gps: { lat: number; lng: number } | null }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-base shadow-[0_10px_28px_rgba(15,23,42,0.12)] backdrop-blur-sm">
      <div className="px-2 py-1">
        <div className="text-label-sm font-label-sm uppercase tracking-wide text-sky-700">位置情報</div>
        <div className="text-body-md font-body-md font-bold text-[#0f172a]">
          {gps ? `EXIF（${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}）` : "未設定"}
        </div>
      </div>
    </div>
  );
}
