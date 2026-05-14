"use client";

import Link from "next/link";

import { AddCircleNavIcon } from "@/components/Nav/AddCircleNavIcon";
import { MapNavIcon } from "@/components/Nav/MapNavIcon";
import { PersonNavIcon } from "@/components/Nav/PersonNavIcon";
import { PhotoPrintsNavIcon } from "@/components/Nav/PhotoPrintsNavIcon";

export function ProfileBottomNavMobile() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe px-4 bg-inverse-surface/92 shadow-lg border-t border-outline/40 rounded-t-xl backdrop-blur-md">
      <Link className="flex flex-col items-center justify-center text-inverse-on-surface/80 px-5 py-1 hover:text-primary-fixed transition-colors" href="/">
        <MapNavIcon />
        <span className="text-label-sm font-label-sm">マップ</span>
      </Link>
      <Link className="flex flex-col items-center justify-center text-inverse-on-surface/80 px-5 py-1 hover:text-primary-fixed transition-colors" href="/">
        <PhotoPrintsNavIcon />
        <span className="text-label-sm font-label-sm">ギャラリー</span>
      </Link>
      <Link className="flex flex-col items-center justify-center text-inverse-on-surface/80 px-5 py-1 hover:text-primary-fixed transition-colors" href="/upload">
        <AddCircleNavIcon />
        <span className="text-label-sm font-label-sm">アップロード</span>
      </Link>
      <span className="flex flex-col items-center justify-center bg-secondary-container dark:bg-on-secondary-fixed-variant text-on-secondary-container dark:text-secondary-fixed rounded-full px-5 py-1 scale-90 transition-all duration-200">
        <PersonNavIcon />
        <span className="text-label-sm font-label-sm">プロフィール</span>
      </span>
    </nav>
  );
}

