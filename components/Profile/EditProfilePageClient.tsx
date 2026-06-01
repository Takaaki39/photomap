"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { BottomNav } from "@/components/Nav/BottomNav";
import { APP_MAIN_BOTTOM_CLASS, APP_MAIN_TOP_CLASS, TopNav } from "@/components/Nav/TopNav";
import { fetchMyProfile, updateMyProfile } from "@/features/profile/api/profileApi";

const BIO_MAX = 200;
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect fill='%23e5e7eb' width='120' height='120'/%3E%3Ccircle cx='60' cy='44' r='22' fill='%23d1d5db'/%3E%3Cellipse cx='60' cy='98' rx='36' ry='26' fill='%23d1d5db'/%3E%3C/svg%3E";

const cardClass =
  "rounded-2xl border border-[#e5e7eb]/80 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06)] sm:p-8";
const labelClass = "mb-2 block text-sm font-semibold text-[#111827]";
const fieldClass =
  "w-full rounded-xl border-0 bg-[#f3f4f6] px-4 py-3 text-[15px] leading-snug text-[#111827] outline-none placeholder:text-[#9ca3af] focus:ring-2 focus:ring-[#2563eb]/25";
const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-60";

export function EditProfilePageClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [primaryLocation, setPrimaryLocation] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(AVATAR_FALLBACK);
  const [iconFile, setIconFile] = useState<File | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const p = await fetchMyProfile();
    if (!p) {
      setError("プロフィールの読み込みに失敗しました。");
      setLoading(false);
      return;
    }
    setFullName(p.display_name ?? "");
    setUsername(p.username?.replace(/^@/, "") ?? "");
    setBio(p.bio ?? "");
    setPrimaryLocation(p.primary_location ?? "");
    setAvatarPreview(p.avatar_url || AVATAR_FALLBACK);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    return () => {
      if (iconFile && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [iconFile, avatarPreview]);

  const onPickPhoto = (file: File | null) => {
    if (!file) return;
    if (file.size > AVATAR_MAX_BYTES) {
      setError("画像は2MB以下にしてください。");
      return;
    }
    const ok = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type);
    if (!ok) {
      setError("JPG、GIF、PNG、WebP形式の画像を選んでください。");
      return;
    }
    setError(null);
    setIconFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const fd = new FormData();
    fd.set("display_name", fullName.trim());
    fd.set("username", username.trim().replace(/^@/, ""));
    fd.set("bio", bio.slice(0, BIO_MAX));
    fd.set("primary_location", primaryLocation.trim());
    if (iconFile) fd.set("icon", iconFile);

    const result = await updateMyProfile(fd);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (result.avatar_url) setAvatarPreview(result.avatar_url);
    setIconFile(null);
    router.push("/profile");
  };

  const bioCount = bio.length;

  return (
    <div className="edit-profile-page min-h-screen bg-[#f3f4f6] font-sans text-[#111827] scheme-light">
      <TopNav />

      <main
        className={`mx-auto w-full max-w-[880px] px-4 sm:px-6 md:px-8 ${APP_MAIN_TOP_CLASS} ${APP_MAIN_BOTTOM_CLASS}`}
      >
        <header className="mb-8">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-[#111827] sm:text-[36px]">
            プロフィールを編集
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#6b7280]">
            表示名や活動場所など、ギャラリーに表示する情報を更新できます。
          </p>
        </header>

        {loading ? (
          <p className="text-center text-[15px] text-[#6b7280]">読み込み中…</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <section className={cardClass}>
              <div className="flex flex-row items-center gap-6 sm:gap-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarPreview}
                  alt=""
                  className="h-[88px] w-[88px] shrink-0 rounded-full border-[3px] border-[#bfdbfe] object-cover shadow-sm sm:h-24 sm:w-24"
                  onError={() => setAvatarPreview(AVATAR_FALLBACK)}
                />
                <div className="min-w-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
                  />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className={btnPrimary}>
                    写真を変更
                  </button>
                  <p className="mt-2 text-xs text-[#6b7280]">JPG、GIF、PNG。最大2MB</p>
                </div>
              </div>
            </section>

            <section className={cardClass}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                <label className="block">
                  <span className={labelClass}>氏名</span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={fieldClass}
                    placeholder="山田 太郎"
                    autoComplete="name"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>ユーザー名</span>
                  <div
                    className={`${fieldClass} flex items-center gap-0.5 px-4 py-0 focus-within:ring-2 focus-within:ring-[#2563eb]/25`}
                  >
                    <span className="shrink-0 text-[15px] text-[#6b7280]">@&nbsp;</span>
                    <input
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value.replace(/\s/g, "").replace(/^@+/, ""))
                      }
                      className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[15px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
                      placeholder="username"
                      autoComplete="username"
                    />
                  </div>
                </label>
              </div>

              <label className="mt-5 block sm:mt-6">
                <span className={labelClass}>自己紹介</span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                  rows={5}
                  className={`${fieldClass} resize-none`}
                  placeholder="あなたの写真や旅について…"
                />
                <p className="mt-1.5 text-right text-xs text-[#6b7280]">
                  {bioCount} / {BIO_MAX} 文字
                </p>
              </label>

              <label className="mt-5 block sm:mt-6">
                <span className={labelClass}>主な活動場所</span>
                <div
                  className={`${fieldClass} flex items-center gap-2 focus-within:ring-2 focus-within:ring-[#2563eb]/25`}
                >
                  <img
                    src="/icons/my_location_48dp_E3E3E3_FILL0_wght400_GRAD0_opsz48.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="block shrink-0 brightness-[0.45]"
                    aria-hidden
                  />
                  <input
                    value={primaryLocation}
                    onChange={(e) => setPrimaryLocation(e.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent py-0 text-[15px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
                    placeholder="東京都, 日本"
                  />
                </div>
              </label>
            </section>

            {error ? (
              <p className="text-center text-sm text-[#dc2626]" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-5 pt-2 pb-4">
              <Link
                href="/profile"
                className="text-sm font-semibold text-[#374151] transition-colors hover:text-[#111827]"
              >
                キャンセル
              </Link>
              <button type="submit" disabled={saving} className={`${btnPrimary} px-6`}>
                {saving ? "保存中…" : "変更を保存"}
              </button>
            </div>
          </form>
        )}
      </main>

      <BottomNav active="profile" />
    </div>
  );
}
