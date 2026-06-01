"use client";

export function UploadPreview({
  previewUrl,
  fileLabel,
  pickable,
  onRequestPick,
}: {
  previewUrl: string | null;
  fileLabel: string | null;
  /** 画像タップでファイル選択を開ける（レビュー中のみ true 推奨） */
  pickable?: boolean;
  onRequestPick?: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.14)] md:aspect-video">
        {previewUrl ? (
          pickable && onRequestPick ? (
            <button
              type="button"
              onClick={onRequestPick}
              className="group relative block h-full w-full cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              aria-label="別の写真を選ぶ"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="" className="pointer-events-none h-full w-full object-cover" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/35 to-transparent px-4 pb-4 pt-12 text-center text-label-md font-label-md text-white opacity-95 transition-opacity group-hover:opacity-100">
                タップして画像を差し替え
              </span>
            </button>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="preview" className="h-full w-full object-cover" />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-body-md font-body-md text-outline">
            プレビューなし
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-headline-lg font-headline-lg text-[#0f172a]">投稿内容を自動入力しました</h2>
        <p className="text-body-lg font-body-lg text-[#475569]">位置情報と地名は自動で設定されます。</p>
        {fileLabel ? <div className="text-label-sm font-label-sm text-[#64748b]">{fileLabel}</div> : null}
      </div>
    </div>
  );
}

