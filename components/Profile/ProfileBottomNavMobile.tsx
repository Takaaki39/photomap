"use client";

import Link from "next/link";

export function ProfileBottomNavMobile() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe px-4 bg-inverse-surface/92 shadow-lg border-t border-outline/40 rounded-t-xl backdrop-blur-md">
      <Link className="flex flex-col items-center justify-center text-inverse-on-surface/80 px-5 py-1 hover:text-primary-fixed transition-colors" href="/">
        <span className="material-symbols-outlined">map</span>
        <span className="text-label-sm font-label-sm">マップ</span>
      </Link>
      <Link className="flex flex-col items-center justify-center text-inverse-on-surface/80 px-5 py-1 hover:text-primary-fixed transition-colors" href="/">
        <span className="material-symbols-outlined">grid_view</span>
        <span className="text-label-sm font-label-sm">ギャラリー</span>
      </Link>
      <Link className="flex flex-col items-center justify-center text-inverse-on-surface/80 px-5 py-1 hover:text-primary-fixed transition-colors" href="/upload">
        <span className="material-symbols-outlined">add_circle</span>
        <span className="text-label-sm font-label-sm">アップロード</span>
      </Link>
      <span className="flex flex-col items-center justify-center bg-secondary-container dark:bg-on-secondary-fixed-variant text-on-secondary-container dark:text-secondary-fixed rounded-full px-5 py-1 scale-90 transition-all duration-200">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          person
        </span>
        <span className="text-label-sm font-label-sm">プロフィール</span>
      </span>
    </nav>
  );
}

