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
        className="w-16 h-16 bg-surface-container-lowest/95 dark:bg-surface-container/99 backdrop-blur-md shadow-lg rounded-full flex items-center justify-center active:scale-90 transition-transform border border-outline-variant/60 dark:border-outline/40"
      >
        <img
          src="/icons/my_location_48dp_E3E3E3_FILL0_wght400_GRAD0_opsz48.svg"
          alt=""
          width={48}
          height={48}
          className="block pointer-events-none"
          aria-hidden
        />
      </button>
      <button
        type="button"
        aria-label="Upload"
        onClick={onUpload}
        className="w-16 h-16 bg-surface-container-lowest/95 dark:bg-surface-container/99 backdrop-blur-md shadow-lg rounded-full flex items-center justify-center active:scale-90 transition-transform border border-outline-variant/60 dark:border-outline/40"
      >
        <img
          src="/icons/add_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg"
          alt=""
          width={48}
          height={48}
          className="block pointer-events-none"
          aria-hidden
        />
      </button>
    </div>
  );
}

