"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ProfileTopNav } from "@/components/Profile/ProfileTopNav";
import { ProfileBottomNavMobile } from "@/components/Profile/ProfileBottomNavMobile";
import type { MyPhoto } from "@/components/Me/types";

export function ProfilePageClient() {
  const [photos, setPhotos] = useState<MyPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    return p.toString();
  }, []);

  const fetchPhotos = useCallback(async () => {
    const res = await fetch(`/api/me/photos?${query}`, { cache: "no-store" });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "取得失敗");
      return;
    }
    setError(null);
    const d = await res.json();
    setPhotos(d.photos ?? []);
  }, [query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPhotos();
  }, [fetchPhotos]);

  // NOTE: next-auth SessionProvider is not wired in this app currently.
  // Keep UI stable by using placeholders; data-driven fields come from /api/me/photos.
  const userName = "Alex Rivera";
  const userImage = "";
  const memberSince = "2022";

  const totalPhotos = photos.length;
  const placesVisited = useMemo(() => {
    const s = new Set<string>();
    for (const p of photos) {
      if (p.spot_name) s.add(p.spot_name);
    }
    return s.size;
  }, [photos]);

  const photosNewestFirst = useMemo(() => {
    return [...photos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [photos]);

  const [tab, setTab] = useState<"gallery" | "favorites" | "maps">("gallery");

  return (
    <div className="bg-background text-on-background min-h-screen pb-24 md:pb-0">
      <ProfileTopNav />

      <main className="pt-16 max-w-7xl mx-auto">
        <section className="profile-cover w-full pt-12 pb-8 px-margin-mobile md:px-margin-desktop">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="User Avatar"
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-md object-cover"
                src={
                  userImage ||
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuBnxUVpEQIWxg-OJ-BVkE76SJL7P3BQYDUxoSD_F9imhXBeDcSg12BatQ9kmi7sURrIyOhXVrS2ABvwbPvf2OO38zDB-FV5OEs7jnmysv75wLtqkNIPGng8ssQnB9lqP6d6hcIpZNcydWjNeHTJRTcZMRQF-6yUyklYZV54myIV-nXWXHYm0XASLnisjRESPFjYrag66-TZQAHcrU2LHrtwelv8sWyxgc-aJthLAwDHLq9Mg-m14jjM3YPczA78kQ8njTuOwRVWqqM"
                }
              />
            </div>

            <div className="flex-1 text-center md:text-left mb-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <h1 className="text-display font-display text-on-surface">{userName}</h1>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-surface-container-high text-on-surface-variant font-label-lg text-label-lg rounded-xl hover:bg-surface-container-highest transition-colors active:scale-95 duration-150"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  プロフィールを編集
                </button>
              </div>
              <p className="mt-2 text-body-lg font-body-lg text-on-surface-variant max-w-xl">
                旅と写真が好き。座標とともに、世界の隠れた魅力を記録しています。
              </p>
            </div>
          </div>
        </section>

        <section className="px-margin-mobile md:px-margin-desktop py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="bg-surface-container-low p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-display font-display text-primary">{totalPhotos}</span>
              <span className="text-label-lg font-label-lg text-outline">写真数</span>
            </div>
            <div className="bg-surface-container-low p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-display font-display text-primary">{placesVisited}</span>
              <span className="text-label-lg font-label-lg text-outline">訪れた場所</span>
            </div>
            <div className="bg-surface-container-low p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-display font-display text-primary">{memberSince}</span>
              <span className="text-label-lg font-label-lg text-outline">登録年</span>
            </div>
          </div>
        </section>

        <nav className="flex border-b border-outline-variant px-margin-mobile md:px-margin-desktop mb-8">
          <button
            type="button"
            onClick={() => setTab("gallery")}
            className={
              tab === "gallery"
                ? "px-6 py-4 border-b-2 border-primary text-primary font-label-lg text-label-lg"
                : "px-6 py-4 text-on-surface-variant hover:text-primary transition-colors font-label-lg text-label-lg"
            }
          >
            ギャラリー
          </button>
          <button
            type="button"
            onClick={() => setTab("favorites")}
            className={
              tab === "favorites"
                ? "px-6 py-4 border-b-2 border-primary text-primary font-label-lg text-label-lg"
                : "px-6 py-4 text-on-surface-variant hover:text-primary transition-colors font-label-lg text-label-lg"
            }
          >
            お気に入り
          </button>
          <button
            type="button"
            onClick={() => setTab("maps")}
            className={
              tab === "maps"
                ? "px-6 py-4 border-b-2 border-primary text-primary font-label-lg text-label-lg"
                : "px-6 py-4 text-on-surface-variant hover:text-primary transition-colors font-label-lg text-label-lg"
            }
          >
            マップ
          </button>
        </nav>

        {error ? (
          <section className="px-margin-mobile md:px-margin-desktop mb-8">
            <p className="text-body-md font-body-md text-error">{error}</p>
          </section>
        ) : null}

        <section className="px-margin-mobile md:px-margin-desktop mb-12">
          <h2 className="text-headline-lg font-headline-lg mb-6 text-on-surface">最近の投稿</h2>

          {tab !== "gallery" ? (
            <div className="text-body-md font-body-md text-on-surface-variant">準備中</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photosNewestFirst.slice(0, 24).map((p) => (
                <div key={p.id} className="group relative aspect-3/4 overflow-hidden rounded-xl bg-surface-container shadow-sm hover:shadow-md transition-shadow">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={p.image_url}
                      alt={p.spot_name || "最近の投稿"}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-label-sm font-label-sm text-outline">
                      画像なし
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-linear-to-t from-black/60 to-transparent">
                    <p className="text-white font-label-sm text-label-sm">{p.spot_name || "名称未設定"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="px-margin-mobile md:px-margin-desktop mb-16">
          <h2 className="text-headline-lg font-headline-lg mb-6 text-on-surface">お気に入りスポット</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row h-auto md:h-48 border border-surface-container-high hover:shadow-md transition-shadow group">
              <div className="w-full md:w-48 h-48 md:h-full relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBD1DdFPQwGP9N8DOkEC2aYBakIdbcn8s7cx4yMIPbaDxkJCMMPLTcBOZ_9fIMwqnu0OdOxrUWWaHk2KHyNfs3MLMhAST7zGFBHMWrUDPbzpgp1dVcugwBUJTz5iasLSRR5mFnbBMqP7GMZw-wau-8S2LtMM6IRRM9diONT3nUx8cbOnU6cOUOSjOJDBlvNxL0eYZujG9KZn2J5vho5Ywwr4Ss4EdikXAbJjfZMNm_4Q8kcckutROuDZX-qXsPKnlvLI2YeXqKSwZ0"
                  alt="Favorite location"
                />
              </div>
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-headline-md font-headline-md text-on-surface">London City Center</h3>
                  <div className="flex items-center gap-1 text-primary mt-1">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span className="text-label-sm font-label-sm">United Kingdom</span>
                  </div>
                  <p className="text-body-md font-body-md text-on-surface-variant mt-2 line-clamp-2">
                    Historic landmarks and vibrant modern architecture meet in this iconic metropolis.
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-primary-fixed"></div>
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-secondary-fixed"></div>
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-surface-variant"></div>
                  </div>
                  <span className="text-label-sm font-label-sm text-outline">12枚</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row h-auto md:h-48 border border-surface-container-high hover:shadow-md transition-shadow group">
              <div className="w-full md:w-48 h-48 md:h-full relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCU3XdobahZ3Q1lGKvvgzgAxdO7Ygzzh_dSu1T6kktdX-jUhIN9gKjdhs_ZiOk4KH0FxYhViW8-rWCqGbZbYs3nwJIZFUEMAb2For9g-vE9RMnTki1sRI1x3EoKgtgXVS6YNMDtX4Mgyty4qxf6ZA6gvVXHCbt8RcbwF9vCXUqjwsbzDJuz3jKYoMK5g8CYPwaxzuTZiHqPidnKzo-460hoki94T6PzdBPVnufF5_aebwJkJyr-isAZt4XKktJTuJFjPcH_y-SGUso"
                  alt="Favorite location"
                />
              </div>
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-headline-md font-headline-md text-on-surface">Venice Canals</h3>
                  <div className="flex items-center gap-1 text-primary mt-1">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span className="text-label-sm font-label-sm">Italy</span>
                  </div>
                  <p className="text-body-md font-body-md text-on-surface-variant mt-2 line-clamp-2">
                    The timeless beauty of winding waterways and historic Italian architecture.
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-tertiary-fixed"></div>
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-primary-fixed"></div>
                  </div>
                  <span className="text-label-sm font-label-sm text-outline">8枚</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ProfileBottomNavMobile />
    </div>
  );
}

