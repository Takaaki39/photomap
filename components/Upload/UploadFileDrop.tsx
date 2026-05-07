"use client";

export function UploadFileDrop({
  onDrop,
  onPickClick,
}: {
  onDrop: React.DragEventHandler<HTMLDivElement>;
  onPickClick: () => void;
}) {
  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={onPickClick}
        className="flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-8 text-center shadow-sm hover:bg-surface-container"
      >
        <div className="text-base font-semibold">画像を選択</div>
        <div className="text-body-md font-body-md text-on-surface-variant">ドラッグ&ドロップ、またはクリック</div>
        <div className="text-label-sm font-label-sm text-outline">JPEG / PNG / HEIC / WebP（最大20MB）</div>
      </div>
    </div>
  );
}

