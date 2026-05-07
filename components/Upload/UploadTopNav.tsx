"use client";

export function UploadTopNav({
  progress,
  onClose,
}: {
  progress: number;
  onClose: () => void;
}) {
  return (
    <header className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-background/90 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container active:scale-95"
          aria-label="閉じる"
        >
          ✕
        </button>
        <h1 className="text-headline-md font-headline-md font-bold text-primary">PhotoMap</h1>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-label-lg font-label-lg text-on-surface-variant md:block">Upload Progress</span>
        <div className="h-2 w-28 overflow-hidden rounded-full bg-surface-container">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>

      <div className="text-primary">●</div>
    </header>
  );
}

