"use client";

export function UploadBottomNavMobile({
  onReset,
}: {
  onReset: () => void;
}) {
  const itemBase = "flex flex-col items-center justify-center text-on-surface-variant px-5 py-1";
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-outline-variant bg-surface-container-lowest px-4 shadow-[0px_4px_12px_rgba(0,0,0,0.10)] backdrop-blur-md md:hidden">
      <button type="button" className={`${itemBase} hover:text-primary transition-colors`}>
        <span className="text-base">🗺</span>
        Map
      </button>
      <button type="button" className={`${itemBase} hover:text-primary transition-colors`}>
        <span className="text-base">▦</span>
        Gallery
      </button>
      <button
        type="button"
        onClick={onReset}
        className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-5 py-1 scale-90 transition-all duration-200 active:scale-95"
      >
        <span className="text-base">＋</span>
        Upload
      </button>
      <button type="button" className={`${itemBase} hover:text-primary transition-colors`}>
        <span className="text-base">👤</span>
        Profile
      </button>
    </nav>
  );
}

