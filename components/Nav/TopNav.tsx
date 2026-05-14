"use client";

import Link from "next/link";

import { AccountCircleNavIcon } from "@/components/Nav/AccountCircleNavIcon";

export function TopNav() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-5 sm:px-6 md:px-10 h-16 bg-inverse-surface/99 backdrop-blur-md shadow-sm bg-background dark:bg-surface-container-lowest">
      <div className="flex items-center gap-md">
        <Link href="/" className="text-headline-md font-headline-md font-bold text-primary-fixed">
          PhotoMap
        </Link>
      </div>

      <div className="flex items-center gap-md">
        <Link
          href="/profile"
          className="inline-flex items-center justify-center p-2 rounded-full hover:bg-inverse-on-surface/10 transition-colors"
          aria-label="プロフィール"
        >
          <AccountCircleNavIcon />
        </Link>
      </div>
    </header>
  );
}
