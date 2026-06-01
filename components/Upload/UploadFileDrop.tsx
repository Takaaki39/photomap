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
        className="group relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-sky-300/70 bg-white/70 p-8 text-center shadow-[0_12px_34px_rgba(15,23,42,0.12)] backdrop-blur-sm transition-colors hover:border-sky-400 hover:bg-white/85"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-sky-300/25 blur-3xl"
        />
        <div className="text-base font-semibold text-[#0f172a]">画像を選択</div>
        <div className="text-body-md font-body-md text-[#334155]">ドラッグ&ドロップ、またはクリック</div>
        <div className="text-label-sm font-label-sm text-[#64748b]">JPEG / PNG / HEIC / WebP（最大20MB）</div>
      </div>
    </div>
  );
}

