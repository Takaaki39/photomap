"use client";

import Link from "next/link";
import type React from "react";

export type BottomNavActive = "map" | "gallery" | "upload" | "profile";

export function BottomNav({
  active,
  galleryHref,
}: {
  active: BottomNavActive;
  galleryHref?: string;
}) {
  const itemBase =
    "flex flex-col items-center justify-center text-inverse-on-surface/80 px-5 py-1 hover:text-primary-fixed transition-colors";

  const pillBase =
    "flex flex-col items-center justify-center bg-secondary-container dark:bg-on-secondary-fixed-variant text-on-secondary-container dark:text-secondary-fixed rounded-full px-5 py-1 scale-90 transition-all duration-200";

  const iconFill = { fontVariationSettings: "'FILL' 1" } as React.CSSProperties;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe px-4 bg-inverse-surface/92 shadow-lg border-t border-outline/40 rounded-t-xl backdrop-blur-md">
      {active === "map" ? (
        <span className={pillBase}>
          <span className="material-symbols-outlined" style={iconFill}>
            map
          </span>
          <span className="text-label-sm font-label-sm">マップ</span>
        </span>
      ) : (
        <Link className={itemBase} href="/">
          <span className="material-symbols-outlined">map</span>
          <span className="text-label-sm font-label-sm">マップ</span>
        </Link>
      )}

      {active === "gallery" ? (
        <span className={pillBase}>
          <span className="material-symbols-outlined" style={iconFill}>
            grid_view
          </span>
          <span className="text-label-sm font-label-sm">ギャラリー</span>
        </span>
      ) : (
        <Link className={itemBase} href={galleryHref ?? "/"}>
          <span className="material-symbols-outlined">grid_view</span>
          <span className="text-label-sm font-label-sm">ギャラリー</span>
        </Link>
      )}

      {active === "upload" ? (
        <span className={pillBase}>
          <span className="material-symbols-outlined" style={iconFill}>
            add_circle
          </span>
          <span className="text-label-sm font-label-sm">アップロード</span>
        </span>
      ) : (
        <Link className={itemBase} href="/upload">
          <span className="material-symbols-outlined">add_circle</span>
          <span className="text-label-sm font-label-sm">アップロード</span>
        </Link>
      )}

      {active === "profile" ? (
        <span className={pillBase}>
          <span className="material-symbols-outlined" style={iconFill}>
            person
          </span>
          <span className="text-label-sm font-label-sm">プロフィール</span>
        </span>
      ) : (
        <Link className={itemBase} href="/profile">
          <span className="material-symbols-outlined">person</span>
          <span className="text-label-sm font-label-sm">プロフィール</span>
        </Link>
      )}
    </nav>
  );
}

