"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/Nav/BottomNav";
import { APP_MAIN_TOP_CLASS } from "@/components/Nav/TopNav";
import { PhotoLightbox } from "@/components/Photo/PhotoLightbox";
import { ProfilePageTopNav } from "@/components/Profile/ProfilePageTopNav";
import type { MyPhoto } from "@/components/Me/types";
import { refreshAllSpotsSnapshot } from "@/lib/spotsBoundsCache";

type MeProfile = {
  display_name: string;
  username: string | null;
  bio: string | null;
  primary_location: string | null;
  avatar_url: string | null;
  email: string | null;
  member_since: string | null;
};

type FavoriteSpot = {
  spotKey: string;
  name: string;
  region: string;
  photos: MyPhoto[];
  coverUrl: string | null;
};

const AVATAR_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect fill='%23dbeafe' width='120' height='120'/%3E%3Ccircle cx='60' cy='44' r='22' fill='%2393c5fd'/%3E%3Cellipse cx='60' cy='98' rx='36' ry='26' fill='%2393c5fd'/%3E%3C/svg%3E";

const SPOT_DOT_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

const DEFAULT_BIO =
  "旅と写真が好き。座標とともに、世界の隠れた魅力を記録しています。";

function spotRegionLabel(name: string, fallback?: string | null) {
  const parts = name.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 1];
  return fallback?.trim() || name;
}

function spotDescription(name: string) {
  return `${name}周辺で撮影した写真と思い出。`;
}

export function ProfilePageClient() {
  const [photos, setPhotos] = useState<MyPhoto[]>([]);
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [avatarSrc, setAvatarSrc] = useState(AVATAR_FALLBACK);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"gallery" | "favorites" | "maps">("gallery");
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    const res = await fetch("/api/me/photos", { cache: "no-store" });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "写真の読み込みに失敗しました。");
      return;
    }
    setError(null);
    const d = await res.json();
    setPhotos(d.photos ?? []);
  }, []);

  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/me/profile", { cache: "no-store" });
    if (!res.ok) return;
    const d = (await res.json()) as { profile?: MeProfile };
    if (!d.profile) return;
    setProfile(d.profile);
    setAvatarSrc(d.profile.avatar_url || AVATAR_FALLBACK);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPhotos();
    void fetchProfile();
  }, [fetchPhotos, fetchProfile]);

  const userName = profile?.display_name ?? "ユーザー";
  const bioText = profile?.bio?.trim() || DEFAULT_BIO;
  const memberSince = profile?.member_since
    ? new Date(profile.member_since).getFullYear().toString()
    : "—";

  const totalPhotos = photos.length;
  const placesVisited = useMemo(() => {
    const s = new Set<string>();
    for (const p of photos) {
      if (p.spot_id) s.add(p.spot_id);
      else if (p.spot_name) s.add(p.spot_name);
    }
    return s.size;
  }, [photos]);

  const photosNewestFirst = useMemo(
    () => [...photos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [photos],
  );

  const favoriteSpots = useMemo((): FavoriteSpot[] => {
    const byKey = new Map<string, MyPhoto[]>();
    for (const p of photos) {
      const key = p.spot_id || p.spot_name || "unknown";
      const list = byKey.get(key) ?? [];
      list.push(p);
      byKey.set(key, list);
    }
    return [...byKey.entries()]
      .map(([spotKey, spotPhotos]) => {
        const sorted = [...spotPhotos].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        const name = sorted[0]?.spot_name || "名称未設定";
        return {
          spotKey,
          name,
          region: spotRegionLabel(name, profile?.primary_location),
          photos: sorted,
          coverUrl: sorted.find((x) => x.image_url)?.image_url ?? null,
        };
      })
      .sort((a, b) => b.photos.length - a.photos.length);
  }, [photos, profile?.primary_location]);

  const activePhoto = useMemo(
    () => photosNewestFirst.find((p) => p.id === activePhotoId) ?? null,
    [activePhotoId, photosNewestFirst],
  );

  const deletePhoto = async (photoId: string) => {
    if (!confirm("この写真を削除しますか？（クラウド上の画像も削除されます）")) return;
    const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
    if (!res.ok) {
      const text = await res.text();
      setError(text || "削除に失敗しました。");
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    if (activePhotoId === photoId) setActivePhotoId(null);
    void refreshAllSpotsSnapshot();
  };

  const tabClass = (id: typeof tab) =>
    id === tab
      ? "border-b-2 border-[#2563eb] px-6 py-4 text-[15px] font-medium text-[#2563eb]"
      : "px-6 py-4 text-[15px] font-medium text-[#6b7280] transition-colors hover:text-[#111827]";

  const showRecent = tab === "gallery";
  const showFavorites = tab === "gallery" || tab === "favorites";
  const showMaps = tab === "maps";

  return (
    <div className="min-h-screen bg-[#f7f9ff] text-[#111827] scheme-light">
      <ProfilePageTopNav />

      <main
        className={`mx-auto max-w-7xl ${APP_MAIN_TOP_CLASS} pb-10 max-md:pb-[88px] md:pb-12`}
      >
        {/* Hero */}
        <section className="profile-cover px-4 pb-10 pt-8 sm:px-6 md:px-10">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className="h-32 w-32 shrink-0 rounded-full border-4 border-white object-cover shadow-md md:h-40 md:w-40"
              src={avatarSrc}
              onError={() => setAvatarSrc(AVATAR_FALLBACK)}
            />

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col items-center gap-3 md:flex-row md:items-center md:gap-4">
                <h1 className="text-[28px] font-bold leading-tight text-[#111827] md:text-[32px]">
                  {userName}
                </h1>
                <Link
                  href="/profile/edit"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-[#d1d5db]"
                >
                  <svg
                    width={16}
                    height={16}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  プロフィールを編集
                </Link>
              </div>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6b7280]">{bioText}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { value: totalPhotos, label: "写真数" },
              { value: placesVisited, label: "訪れた場所" },
              { value: memberSince, label: "登録年" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center rounded-xl border border-[#e5e7eb]/60 bg-white px-6 py-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              >
                <span className="text-[32px] font-bold leading-none text-[#2563eb]">{stat.value}</span>
                <span className="mt-2 text-xs font-medium text-[#9ca3af]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Tabs */}
        <nav className="flex border-b border-[#e5e7eb] px-4 sm:px-6 md:px-10" aria-label="プロフィールのセクション">
          <button type="button" onClick={() => setTab("gallery")} className={tabClass("gallery")}>
            ギャラリー
          </button>
          <button type="button" onClick={() => setTab("favorites")} className={tabClass("favorites")}>
            お気に入り
          </button>
          <button type="button" onClick={() => setTab("maps")} className={tabClass("maps")}>
            マップ
          </button>
        </nav>

        <div className="px-4 sm:px-6 md:px-10">
          {error ? (
            <p className="mt-6 text-sm text-[#dc2626]" role="alert">
              {error}
            </p>
          ) : null}

          {showMaps ? (
            <section className="py-12 text-center">
              <p className="text-[15px] text-[#6b7280]">地図で写真のピンを確認できます。</p>
              <Link
                href="/"
                className="mt-4 inline-flex rounded-xl bg-[#2563eb] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
              >
                マップを開く
              </Link>
            </section>
          ) : null}

          {showRecent ? (
            <section className="mb-12 mt-8">
              <h2 className="mb-6 text-xl font-bold text-[#111827]">最近の投稿</h2>
              {photosNewestFirst.length === 0 ? (
                <p className="text-[15px] text-[#6b7280]">まだ写真がありません。</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {photosNewestFirst.slice(0, 24).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setActivePhotoId(p.id)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        setActivePhotoId(p.id);
                      }}
                      className="group relative aspect-3/4 cursor-pointer overflow-hidden rounded-xl bg-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-md"
                      role="button"
                      tabIndex={0}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void deletePhoto(p.id);
                        }}
                        className="absolute left-2 top-2 z-10 rounded-full bg-white/90 p-1 shadow hover:bg-white"
                        aria-label="写真を削除"
                      >
                        <img
                          src="/icons/delete_32dp.svg"
                          alt=""
                          width={20}
                          height={20}
                          className="block size-5"
                          draggable={false}
                        />
                      </button>
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          src={p.image_url}
                          alt={p.spot_name || "写真"}
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-[#9ca3af]">
                          画像なし
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/65 to-transparent p-3 pt-8">
                        <p className="text-sm font-medium text-white">{p.spot_name || "名称未設定"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {showFavorites ? (
            <section className="mb-16 mt-8">
              <h2 className="mb-6 text-xl font-bold text-[#111827]">お気に入りの場所</h2>
              {favoriteSpots.length === 0 ? (
                <p className="text-[15px] text-[#6b7280]">写真をアップロードすると、よく行く場所が表示されます。</p>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {favoriteSpots.slice(0, tab === "favorites" ? 20 : 4).map((spot, index) => (
                    <Link
                      key={spot.spotKey}
                      href={`/gallery/${encodeURIComponent(spot.spotKey)}`}
                      className="flex flex-col overflow-hidden rounded-xl border border-[#e5e7eb]/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-md sm:flex-row sm:h-48"
                    >
                      <div className="relative h-48 w-full shrink-0 overflow-hidden sm:h-full sm:w-48">
                        {spot.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={spot.coverUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#e5e7eb] text-sm text-[#9ca3af]">
                            画像なし
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-6">
                        <div>
                          <h3 className="text-lg font-bold text-[#111827]">{spot.name}</h3>
                          <p className="mt-1 flex items-center gap-1 text-sm text-[#2563eb]">
                            <img
                              src="/icons/my_location_48dp_E3E3E3_FILL0_wght400_GRAD0_opsz48.svg"
                              alt=""
                              width={16}
                              height={16}
                              className="block brightness-[0.35] hue-rotate-[200deg]"
                              aria-hidden
                            />
                            {spot.region}
                          </p>
                          <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-[#6b7280]">
                            {spotDescription(spot.name)}
                          </p>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {SPOT_DOT_COLORS.slice(0, 3).map((color, i) => (
                              <span
                                key={color}
                                className="h-6 w-6 rounded-full border-2 border-white"
                                style={{
                                  backgroundColor:
                                    SPOT_DOT_COLORS[(index + i) % SPOT_DOT_COLORS.length],
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-[#9ca3af]">{spot.photos.length}枚</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>
      </main>

      <PhotoLightbox
        open={Boolean(activePhoto?.image_url)}
        src={activePhoto?.image_url ?? null}
        alt={activePhoto?.spot_name || "写真"}
        onClose={() => setActivePhotoId(null)}
      />

      <div className="md:hidden">
        <BottomNav active="profile" />
      </div>
    </div>
  );
}
