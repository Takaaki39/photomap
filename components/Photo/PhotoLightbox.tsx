"use client";

import { useEffect } from "react";

export function PhotoLightbox({
  open,
  src,
  alt,
  onClose,
}: {
  open: boolean;
  src: string | null;
  alt?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !src) return null;

  return (
    <div
      className="fixed inset-0 z-9999 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-5xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-surface-container-lowest text-on-surface shadow-lg flex items-center justify-center hover:bg-surface-container-high transition-colors"
            aria-label="閉じる"
          >
            <img
              src="/icons/close_32dp.svg"
              alt=""
              width={24}
              height={24}
              className="block size-6"
              draggable={false}
            />
          </button>

          <div className="overflow-hidden rounded-2xl bg-black shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt ?? ""} className="w-full h-full max-h-[85vh] object-contain bg-black" />
          </div>
        </div>
      </div>
    </div>
  );
}

