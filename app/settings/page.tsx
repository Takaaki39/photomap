"use client";

import { FormEvent, useState } from "react";
import { signOut } from "next-auth/react";
import { useTheme } from "@/components/Theme/ThemeProvider";

export default function SettingsPage() {
  const { preference: theme, setPreference: setTheme } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [icon, setIcon] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    if (displayName) fd.set("display_name", displayName);
    if (icon) fd.set("icon", icon);

    const res = await fetch("/api/me/profile", { method: "PATCH", body: fd });
    const d = await res.json();
    setMessage(res.ok ? "プロフィールを更新しました。" : d.error ?? "更新に失敗しました。");
  };

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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">設定</h1>

      <section className="mt-6 space-y-3 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">表示</h2>
        <label className="block text-sm text-on-surface-variant">テーマ</label>
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
                    ? "rounded-full bg-secondary-container text-on-secondary-container px-4 py-2 text-label-lg font-label-lg"
                    : "rounded-full bg-surface-container-low text-on-surface-variant px-4 py-2 text-label-lg font-label-lg border border-outline-variant hover:border-outline transition-colors"
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-outline">
          「システム」は端末のダークモード設定に追従します。
        </p>
      </section>

      <form onSubmit={onSaveProfile} className="mt-6 space-y-4 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">プロフィール</h2>
        <label className="block">
          <span className="mb-1 block text-sm">表示名</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="表示名を入力"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm">アイコン画像</span>
          <input type="file" accept="image/*" onChange={(e) => setIcon(e.target.files?.[0] ?? null)} />
        </label>
        <button
          type="submit"
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-container"
        >
          保存
        </button>
      </form>

      <section className="mt-6 rounded-lg border border-red-300 p-4">
        <h2 className="text-lg font-semibold text-red-700">アカウント削除</h2>
        <p className="mt-1 text-sm text-red-600">削除すると投稿データを含めて復元できません。</p>
        <button
          type="button"
          onClick={onDeleteAccount}
          className="mt-3 rounded border border-red-400 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
        >
          アカウントを削除
        </button>
      </section>

      {message ? <p className="mt-4 text-sm text-on-surface">{message}</p> : null}
    </main>
  );
}
