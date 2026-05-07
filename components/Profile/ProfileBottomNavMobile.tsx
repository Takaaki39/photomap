"use client";

import Link from "next/link";

export function ProfileBottomNavMobile() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe px-4 bg-surface/95 border-t border-outline-variant">
      <Link className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-1 hover:text-primary transition-all" href="/">
        <span className="material-symbols-outlined">map</span>
        <span className="text-label-sm font-label-sm">マップ</span>
      </Link>
      <Link className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-1 hover:text-primary transition-all" href="/">
        <span className="material-symbols-outlined">grid_view</span>
        <span className="text-label-sm font-label-sm">ギャラリー</span>
      </Link>
      <Link className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-1 hover:text-primary transition-all" href="/upload">
        <span className="material-symbols-outlined">add_circle</span>
        <span className="text-label-sm font-label-sm">アップロード</span>
      </Link>
      <span className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-5 py-1 scale-90 transition-all">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          person
        </span>
        <span className="text-label-sm font-label-sm">プロフィール</span>
      </span>
    </nav>
  );
}

