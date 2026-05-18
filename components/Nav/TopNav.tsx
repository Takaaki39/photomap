"use client";

import Link from "next/link";
import { AccountCircleNavIcon } from "@/components/Nav/AccountCircleNavIcon";

/** 固定ヘッダー（h-16）ぶんの main 上余白 */
export const APP_MAIN_TOP_CLASS = "pt-20";

/** 固定フッターナビ（h-[72px]）ぶんの main 下余白 */
export const APP_MAIN_BOTTOM_CLASS = "pb-[88px]";

/** PhotoMap 共通ヘッダー: 白背景 + ロゴ + プロフィール */
export function TopNav() {
  return (
    <header className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#e5e7eb] bg-white px-4 sm:px-6 md:px-8">
      <Link
        href="/"
        className="text-xl font-bold tracking-tight text-[#2563eb] sm:text-[22px]"
      >
        PhotoMap
      </Link>

      <Link
        href="/profile"
        className="inline-flex items-center justify-center rounded-full p-1 hover:bg-[#f3f4f6]"
        aria-label="プロフィール"
      >
        <AccountCircleNavIcon />
      </Link>
    </header>
  );
}
