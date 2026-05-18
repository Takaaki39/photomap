"use client";

import Link from "next/link";
import { AccountCircleNavIcon } from "@/components/Nav/AccountCircleNavIcon";

const navLink =
  "px-3 py-2 text-[15px] font-medium text-[#6b7280] transition-colors hover:text-[#111827]";
const navLinkActive =
  "px-3 py-2 text-[15px] font-medium text-[#2563eb] border-b-2 border-[#2563eb]";

/** プロフィールページ mock 準拠: 中央ナビ付きヘッダー（デスクトップ） */
export function ProfilePageTopNav() {
  return (
    <header className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#e5e7eb] bg-white px-4 sm:px-6 md:px-10">
      <Link href="/" className="text-xl font-bold tracking-tight text-[#1e3a8a] sm:text-[22px]">
        PhotoMap
      </Link>

      <nav
        className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex"
        aria-label="Main"
      >
        <Link href="/" className={navLink}>
          Map
        </Link>
        <Link href="/" className={navLink}>
          Gallery
        </Link>
        <Link href="/upload" className={navLink}>
          Upload
        </Link>
        <span className={navLinkActive} aria-current="page">
          Profile
        </span>
      </nav>

      <Link
        href="/profile"
        className="inline-flex items-center justify-center rounded-full p-1 hover:bg-[#f3f4f6]"
        aria-label="Profile"
      >
        <AccountCircleNavIcon />
      </Link>
    </header>
  );
}
