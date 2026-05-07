"use client";

import Link from "next/link";

export function GalleryFab() {
  return (
    <Link
      href="/upload"
      className="fixed bottom-24 right-6 w-14 h-14 bg-secondary text-on-secondary rounded-full flex items-center justify-center shadow-[0px_8px_24px_rgba(0,0,0,0.15)] hover:scale-105 transition-transform z-40"
      aria-label="Upload"
    >
      <span className="material-symbols-outlined text-[32px]">add_photo_alternate</span>
    </Link>
  );
}

