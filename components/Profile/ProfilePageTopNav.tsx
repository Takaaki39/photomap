"use client";

import Link from "next/link";
import { AccountCircleNavIcon } from "@/components/Nav/AccountCircleNavIcon";

/** プロフィールページ用ヘッダー（デスクトップは中央ナビ表示） */
export function ProfilePageTopNav() {
  return (
    <header className="app-header app-header--profile">
      <Link href="/" className="app-header__logo">
        PhotoMap
      </Link>

      <nav className="app-header__center-nav" aria-label="メインナビゲーション">
        <Link href="/" className="app-header__nav-link">
          マップ
        </Link>
        <Link href="/" className="app-header__nav-link">
          ギャラリー
        </Link>
        <Link href="/upload" className="app-header__nav-link">
          アップロード
        </Link>
        <span className="app-header__nav-link--active" aria-current="page">
          プロフィール
        </span>
      </nav>

      <Link href="/profile" className="app-header__profile-link" aria-label="プロフィール">
        <AccountCircleNavIcon />
      </Link>
    </header>
  );
}
