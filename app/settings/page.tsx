"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { BottomNav } from "@/components/Nav/BottomNav";
import { APP_MAIN_BOTTOM_CLASS, APP_MAIN_TOP_CLASS, TopNav } from "@/components/Nav/TopNav";
import { useTheme } from "@/components/Theme/ThemeProvider";

export default function SettingsPage() {
  const { preference: theme, setPreference: setTheme } = useTheme();
  const [message, setMessage] = useState<string | null>(null);

  const onDeleteAccount = async () => {
    if (!confirm("アカウントを削除します。元に戻せません。")) return;
    const res = await fetch("/api/me/account", { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      setMessage(d.error ?? "アカウント削除に失敗しました。");
      return;
    }
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#111827] scheme-light">
      <TopNav />

      <main className={`mx-auto max-w-2xl px-4 sm:px-6 ${APP_MAIN_TOP_CLASS} ${APP_MAIN_BOTTOM_CLASS}`}>
        <h1 className="text-2xl font-bold text-[#111827]">設定</h1>

        <section className="mt-6 space-y-3 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">表示</h2>
          <label className="block text-sm text-[#6b7280]">テーマ</label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "system", label: "システム" },
                { id: "light", label: "ライト" },
                { id: "dark", label: "ダーク" },
              ] as const
            ).map((opt) => {
              const active = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                  }}
                  className={
                    active
                      ? "rounded-full bg-[#bbf7d0] px-4 py-2 text-sm font-medium text-[#111827]"
                      : "rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#6b7280] hover:border-[#d1d5db]"
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-[#9ca3af]">「システム」は端末のダークモード設定に追従します。</p>
        </section>

        <section className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">プロフィール</h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            表示名・写真・自己紹介などはプロフィール編集ページで変更できます。
          </p>
          <Link
            href="/profile/edit"
            className="mt-3 inline-block rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
          >
            プロフィールを編集
          </Link>
        </section>

        <section className="mt-6 rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-red-700">アカウント削除</h2>
          <p className="mt-1 text-sm text-red-600">削除すると投稿データを含めて復元できません。</p>
          <button
            type="button"
            onClick={onDeleteAccount}
            className="mt-3 rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            アカウントを削除
          </button>
        </section>

        {message ? <p className="mt-4 text-sm text-[#111827]">{message}</p> : null}
      </main>

      <BottomNav active="profile" />
    </div>
  );
}
