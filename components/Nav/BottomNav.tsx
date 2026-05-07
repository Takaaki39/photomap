"use client";

import Link from "next/link";

export type BottomNavActive = "map" | "gallery" | "upload" | "profile";

export function BottomNav({
  active,
  galleryHref,
}: {
  active: BottomNavActive;
  galleryHref?: string;
}) {
  const itemBase =
    "flex flex-col items-center justify-center text-on-surface-variant dark:text-outline px-5 py-1 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors";

  const pillBase =
    "flex flex-col items-center justify-center bg-secondary-container dark:bg-on-secondary-fixed-variant text-on-secondary-container dark:text-secondary-fixed rounded-full px-5 py-1 scale-90 transition-all duration-200";

  const iconFill = { fontVariationSettings: "'FILL' 1" } as React.CSSProperties;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe px-4 bg-surface-container-lowest/98 dark:bg-surface-container/98 shadow-lg border-t border-outline-variant dark:border-outline rounded-t-xl backdrop-blur-md">
      {active === "map" ? (
        <span className={pillBase}>
          <span className="material-symbols-outlined" style={iconFill}>
            map
          </span>
          <span className="text-label-sm font-label-sm">Map</span>
        </span>
      ) : (
        <Link className={itemBase} href="/">
          <span className="material-symbols-outlined">map</span>
          <span className="text-label-sm font-label-sm">Map</span>
        </Link>
      )}

      {active === "gallery" ? (
        <span className={pillBase}>
          <span className="material-symbols-outlined" style={iconFill}>
            grid_view
          </span>
          <span className="text-label-sm font-label-sm">Gallery</span>
        </span>
      ) : (
        <Link className={itemBase} href={galleryHref ?? "/"}>
          <span className="material-symbols-outlined">grid_view</span>
          <span className="text-label-sm font-label-sm">Gallery</span>
        </Link>
      )}

      {active === "upload" ? (
        <span className={pillBase}>
          <span className="material-symbols-outlined" style={iconFill}>
            add_circle
          </span>
          <span className="text-label-sm font-label-sm">Upload</span>
        </span>
      ) : (
        <Link className={itemBase} href="/upload">
          <span className="material-symbols-outlined">add_circle</span>
          <span className="text-label-sm font-label-sm">Upload</span>
        </Link>
      )}

      {active === "profile" ? (
        <span className={pillBase}>
          <span className="material-symbols-outlined" style={iconFill}>
            person
          </span>
          <span className="text-label-sm font-label-sm">Profile</span>
        </span>
      ) : (
        <Link className={itemBase} href="/profile">
          <span className="material-symbols-outlined">person</span>
          <span className="text-label-sm font-label-sm">Profile</span>
        </Link>
      )}
    </nav>
  );
}

