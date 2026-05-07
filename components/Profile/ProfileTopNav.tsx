"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export function ProfileTopNav() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16 bg-surface/90 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-4">
        <span className="text-headline-md font-headline-md font-bold text-primary">GeoLens</span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <Link
          className="text-on-surface-variant hover:bg-surface-container-high transition-colors px-3 py-2 rounded-lg font-body-md text-body-md"
          href="/"
        >
          マップ
        </Link>
        <Link
          className="text-on-surface-variant hover:bg-surface-container-high transition-colors px-3 py-2 rounded-lg font-body-md text-body-md"
          href="/"
        >
          ギャラリー
        </Link>
        <Link
          className="text-on-surface-variant hover:bg-surface-container-high transition-colors px-3 py-2 rounded-lg font-body-md text-body-md"
          href="/upload"
        >
          アップロード
        </Link>
        <span className="text-primary border-b-2 border-primary font-body-md text-body-md">プロフィール</span>
      </div>

      <div className="flex items-center">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mr-2 hidden md:inline-flex items-center justify-center rounded-lg px-3 py-2 text-body-md font-body-md text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          ログアウト
        </button>
        <Link
          href="/profile"
          className="material-symbols-outlined text-primary text-2xl p-2 rounded-full hover:bg-surface-container-high transition-colors"
          aria-label="Account"
        >
          account_circle
        </Link>
      </div>
    </header>
  );
}

