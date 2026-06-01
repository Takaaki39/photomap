"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BottomNav } from "@/components/Nav/BottomNav";
import { APP_MAIN_TOP_CLASS } from "@/components/Nav/TopNav";
import { PhotoLightbox } from "@/components/Photo/PhotoLightbox";
import { ProfilePageTopNav } from "@/components/Profile/ProfilePageTopNav";
import {
  buildFavoriteSpots,
  countPlacesVisited,
  sortPhotosNewestFirst,
  spotDescription,
} from "@/features/profile/lib/profileStats";
import { useMyPhotos } from "@/features/profile/hooks/useMyPhotos";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";

const AVATAR_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect fill='%23dbeafe' width='120' height='120'/%3E%3Ccircle cx='60' cy='44' r='22' fill='%2393c5fd'/%3E%3Cellipse cx='60' cy='98' rx='36' ry='26' fill='%2393c5fd'/%3E%3C/svg%3E";

const SPOT_DOT_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export function ProfilePageClient() {
  const { profile } = useMyProfile();
  const {
    photos,
    error,
    removePhoto,
    removeAllPhotos,
    bulkDeleting,
    bulkProgress,
  } = useMyPhotos();

  const [avatarSrc, setAvatarSrc] = useState(AVATAR_FALLBACK);
  const [tab, setTab] = useState<"gallery" | "favorites" | "maps">("gallery");
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);

  const userName = profile?.display_name ?? "ユーザー";
  const bioText = profile?.bio?.trim() ?? "";
  const memberSince = profile?.member_since
    ? new Date(profile.member_since).getFullYear().toString()
    : "—";

  const totalPhotos = photos.length;
  const placesVisited = useMemo(() => countPlacesVisited(photos), [photos]);
  const photosNewestFirst = useMemo(() => sortPhotosNewestFirst(photos), [photos]);
  const favoriteSpots = useMemo(
    () => buildFavoriteSpots(photos, profile),
    [photos, profile],
  );

  const activePhoto = useMemo(
    () => photosNewestFirst.find((p) => p.id === activePhotoId) ?? null,
    [activePhotoId, photosNewestFirst],
  );

  const deletePhoto = async (photoId: string) => {
    const ok = await removePhoto(photoId);
    if (ok && activePhotoId === photoId) setActivePhotoId(null);
  };

  const bulkDeleteAll = async () => {
    const ok = await removeAllPhotos();
    if (ok) setActivePhotoId(null);
  };

  const tabClass = (id: typeof tab) =>
    id === tab
      ? "rounded-full border border-sky-500/30 bg-sky-500/12 px-4 py-2 text-[14px] font-semibold text-sky-700"
      : "rounded-full border border-slate-200 bg-white px-4 py-2 text-[14px] font-medium text-[#64748b] transition-colors hover:bg-slate-50 hover:text-[#111827]";

  const showRecent = tab === "gallery";
  const showFavorites = tab === "gallery" || tab === "favorites";
  const showMaps = tab === "maps";

  const displayAvatar = profile?.avatar_url || avatarSrc;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#eef4ff_42%,#e9edf6_100%)] text-[#111827] scheme-light">
      <ProfilePageTopNav />

      <main
        className={`mx-auto max-w-7xl px-4 sm:px-6 md:px-10 ${APP_MAIN_TOP_CLASS} pb-10 max-md:pb-[68px] md:pb-12`}
      >
        <section className="profile-cover mt-2 rounded-3xl border border-slate-200/80 bg-white/85 px-5 pb-8 pt-7 shadow-[0_14px_36px_rgba(15,23,42,0.1)] backdrop-blur-sm sm:px-6 md:px-8">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className="h-32 w-32 shrink-0 rounded-full border-4 border-white object-cover shadow-md md:h-40 md:w-40"
              src={displayAvatar}
              onError={() => setAvatarSrc(AVATAR_FALLBACK)}
            />

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col items-center gap-3 md:flex-row md:items-center md:gap-4">
                <h1 className="text-[28px] font-bold leading-tight text-[#0f172a] md:text-[32px]">
                  {userName}
                </h1>
                <Link
                  href="/profile/edit"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#334155] shadow-sm transition-colors hover:bg-slate-50"
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
              {bioText ? (
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#475569]">{bioText}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { value: totalPhotos, label: "写真数" },
              { value: placesVisited, label: "訪れた場所" },
              { value: memberSince, label: "登録年" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-2 py-3 text-center shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-6 sm:py-6"
              >
                <span className="text-[22px] font-bold leading-none text-[#2563eb] sm:text-[32px]">{stat.value}</span>
                <span className="mt-1 text-[10px] font-medium text-[#64748b] sm:mt-2 sm:text-xs">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <nav className="mt-6 flex flex-wrap gap-2" aria-label="プロフィールのセクション">
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

        <div className="mt-4">
          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm" role="alert">
              {error}
            </div>
          ) : null}

          {showMaps ? (
            <section className="rounded-2xl border border-slate-200/80 bg-white/90 py-12 text-center shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
              <p className="text-[15px] text-[#64748b]">地図で写真のピンを確認できます。</p>
              <Link
                href="/"
                className="mt-4 inline-flex rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(14,116,144,0.32)] transition-colors hover:bg-sky-700"
              >
                マップを開く
              </Link>
            </section>
          ) : null}

          {showRecent ? (
            <section className="mb-12 mt-8 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.09)] sm:p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-[#111827]">最近の投稿</h2>
                {photosNewestFirst.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => void bulkDeleteAll()}
                    disabled={bulkDeleting}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#fca5a5] bg-white px-3 py-1.5 text-sm font-medium text-[#dc2626] shadow-sm transition-colors hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="自分の写真を全削除（仮）"
                    title="開発用の仮ボタン: 自分の写真を全削除"
                  >
                    {bulkDeleting && bulkProgress
                      ? `削除中… ${bulkProgress.done}/${bulkProgress.total}`
                      : `全削除（仮・${photosNewestFirst.length}枚）`}
                  </button>
                ) : null}
              </div>
              {photosNewestFirst.length === 0 ? (
                <p className="text-[15px] text-[#64748b]">まだ写真がありません。</p>
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
            <section className="mb-16 mt-8 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.09)] sm:p-6">
              <h2 className="mb-6 text-xl font-bold text-[#111827]">お気に入りの場所</h2>
              {favoriteSpots.length === 0 ? (
                <p className="text-[15px] text-[#64748b]">写真をアップロードすると、よく行く場所が表示されます。</p>
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
                              className="block brightness-[0.35] hue-rotate-200"
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
