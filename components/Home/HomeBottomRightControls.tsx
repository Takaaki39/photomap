"use client";

export function HomeBottomRightControls({
  onLocate,
  onUpload,
}: {
  onLocate: () => void;
  onUpload: () => void;
}) {
  return (
    <div className="absolute bottom-32 right-4 md:right-8 z-20 flex flex-col gap-4 items-end">
      <button
        type="button"
        aria-label="Current location"
        onClick={onLocate}
        className="w-12 h-12 bg-surface-container-lowest/95 dark:bg-surface-container/95 backdrop-blur-md shadow-lg rounded-full flex items-center justify-center text-primary active:scale-90 transition-transform border border-outline-variant/60 dark:border-outline/40"
      >
        <span className="material-symbols-outlined">my_location</span>
      </button>
      <button
        type="button"
        aria-label="Upload"
        onClick={onUpload}
        className="w-16 h-16 bg-secondary-container text-on-secondary-container shadow-2xl rounded-full flex items-center justify-center hover:bg-secondary transition-colors active:scale-95"
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
      </button>
    </div>
  );
}

