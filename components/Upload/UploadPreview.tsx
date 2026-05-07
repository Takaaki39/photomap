"use client";

export function UploadPreview({
  previewUrl,
  fileLabel,
}: {
  previewUrl: string | null;
  fileLabel: string | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="relative aspect-4/5 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-highest shadow-lg md:aspect-video">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-body-md font-body-md text-outline">
            プレビューなし
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-headline-lg font-headline-lg">Review your memory</h2>
        <p className="text-body-lg font-body-lg text-on-surface-variant">写真のメタデータ（位置情報など）を確認してから投稿できます。</p>
        {fileLabel ? <div className="text-label-sm font-label-sm text-outline">{fileLabel}</div> : null}
      </div>
    </div>
  );
}

