"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { BottomNav } from "@/components/Nav/BottomNav";
import { APP_MAIN_BOTTOM_CLASS, APP_MAIN_TOP_CLASS, TopNav } from "@/components/Nav/TopNav";

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

type MeProfile = {
  display_name: string;
  username: string | null;
  bio: string | null;
  primary_location: string | null;
  avatar_url: string | null;
  email: string | null;
};

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
    const res = await fetch("/api/me/profile", { cache: "no-store" });
    if (!res.ok) {
      setError("Failed to load profile.");
      setLoading(false);
      return;
    }
    const d = (await res.json()) as { profile?: MeProfile };
    const p = d.profile;
    if (p) {
      setFullName(p.display_name ?? "");
      setUsername(p.username?.replace(/^@/, "") ?? "");
      setBio(p.bio ?? "");
      setPrimaryLocation(p.primary_location ?? "");
      setAvatarPreview(p.avatar_url || AVATAR_FALLBACK);
    }
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
      setError("Max file size is 2MB.");
      return;
    }
    const ok = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type);
    if (!ok) {
      setError("JPG, GIF or PNG only.");
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

    const res = await fetch("/api/me/profile", { method: "PATCH", body: fd });
    const d = (await res.json()) as { error?: string; avatar_url?: string | null };
    setSaving(false);

    if (!res.ok) {
      setError(d.error ?? "Failed to save changes.");
      return;
    }

    if (d.avatar_url) setAvatarPreview(d.avatar_url);
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
            Edit Profile
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#6b7280]">
            Update your personal details and location settings for your lens gallery.
          </p>
        </header>

        {loading ? (
          <p className="text-center text-[15px] text-[#6b7280]">Loading…</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Profile picture card */}
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
                    Change Photo
                  </button>
                  <p className="mt-2 text-xs text-[#6b7280]">JPG, GIF or PNG. Max size 2MB</p>
                </div>
              </div>
            </section>

            {/* Profile information card */}
            <section className={cardClass}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                <label className="block">
                  <span className={labelClass}>Full Name</span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={fieldClass}
                    placeholder="Alexander Thorne"
                    autoComplete="name"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Username</span>
                  <div className={`${fieldClass} flex items-center gap-0.5 px-4 py-0 focus-within:ring-2 focus-within:ring-[#2563eb]/25`}>
                    <span className="shrink-0 text-[15px] text-[#6b7280]">@&nbsp;</span>
                    <input
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value.replace(/\s/g, "").replace(/^@+/, ""))
                      }
                      className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[15px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
                      placeholder="alex_thorne"
                      autoComplete="username"
                    />
                  </div>
                </label>
              </div>

              <label className="mt-5 block sm:mt-6">
                <span className={labelClass}>Short Bio</span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                  rows={5}
                  className={`${fieldClass} resize-none`}
                  placeholder="Exploring the hidden architectural gems..."
                />
                <p className="mt-1.5 text-right text-xs text-[#6b7280]">
                  {bioCount} / {BIO_MAX} characters
                </p>
              </label>

              <label className="mt-5 block sm:mt-6">
                <span className={labelClass}>Primary Location</span>
                <div className={`${fieldClass} flex items-center gap-2 focus-within:ring-2 focus-within:ring-[#2563eb]/25`}>
                  <span
                    className="material-symbols-outlined shrink-0 text-[20px] text-[#6b7280]"
                    aria-hidden
                  >
                    location_on
                  </span>
                  <input
                    value={primaryLocation}
                    onChange={(e) => setPrimaryLocation(e.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent py-0 text-[15px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
                    placeholder="Stockholm, Sweden"
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
                Cancel
              </Link>
              <button type="submit" disabled={saving} className={`${btnPrimary} px-6`}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </main>

      <BottomNav active="profile" />
    </div>
  );
}
