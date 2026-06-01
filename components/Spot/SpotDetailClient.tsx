"use client";

import { useEffect, useMemo, useState } from "react";
import AdBanner from "@/components/AdBanner";
import { BottomNav } from "@/components/Nav/BottomNav";
import { APP_MAIN_BOTTOM_CLASS, APP_MAIN_TOP_CLASS, TopNav } from "@/components/Nav/TopNav";
import { fetchSpotDetail, fetchSpotPhotosAll } from "@/features/gallery/api/galleryApi";
import type { SpotDetail, SpotPhoto } from "@/features/gallery/types";

export function SpotDetailClient({ spotId, currentUserId }: { spotId: string; currentUserId?: string }) {
  const [spot, setSpot] = useState<SpotDetail | null>(null);
  const [photos, setPhotos] = useState<SpotPhoto[]>([]);
  const [lightbox, setLightbox] = useState<SpotPhoto | null>(null);

  useEffect(() => {
    void (async () => {
      const [spotData, photoList] = await Promise.all([
        fetchSpotDetail(spotId),
        fetchSpotPhotosAll(spotId),
      ]);
      setSpot(spotData);
      setPhotos(photoList);
    })();
  }, [spotId]);

  const ownPhotosCount = useMemo(() => photos.filter((p) => p.user_id === currentUserId).length, [photos, currentUserId]);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#111827] scheme-light">
      <TopNav />

      <main className={`mx-auto max-w-6xl px-4 sm:px-6 ${APP_MAIN_TOP_CLASS} ${APP_MAIN_BOTTOM_CLASS}`}>
        <h1 className="text-2xl font-bold">{spot?.name ?? "スポット詳細"}</h1>
        <p className="mt-2 text-sm text-[#6b7280]">{spot?.address ?? "住所なし"}</p>
        <p className="mt-1 text-xs text-[#9ca3af]">
          座標: {spot?.lat?.toFixed(6) ?? "-"}, {spot?.lng?.toFixed(6) ?? "-"}
        </p>

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <article key={photo.id} className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
              <button
                type="button"
                className="block w-full"
                onClick={() => setLightbox(photo)}
                aria-label={`画像を拡大表示: ${photo.author_name}`}
              >
                {photo.image_url ? (
                  <img src={photo.image_url} alt={`投稿画像 by ${photo.author_name}`} className="h-52 w-full object-cover" />
                ) : (
                  <div className="flex h-52 w-full items-center justify-center bg-[#f3f4f6] text-xs text-[#9ca3af]">
                    画像を表示できません
                  </div>
                )}
              </button>
              <div className="space-y-1 p-3 text-xs">
                <p>投稿者: {photo.author_name}</p>
                <p>投稿日時: {new Date(photo.created_at).toLocaleString("ja-JP")}</p>
                <span
                  className={`inline-block rounded px-2 py-0.5 text-[11px] ${
                    photo.is_public ? "bg-emerald-100 text-emerald-800" : "bg-[#f3f4f6] text-[#374151]"
                  }`}
                >
                  {photo.is_public ? "公開" : "非公開"}
                </span>
              </div>
            </article>
          ))}
        </section>

        <div className="mt-8 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs text-[#9ca3af]">広告</p>
          <AdBanner />
        </div>

        {ownPhotosCount > 0 ? (
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm hover:bg-[#f9fafb]"
            >
              スポット統合
            </button>
            <button
              type="button"
              className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm hover:bg-[#f9fafb]"
            >
              スポット分割
            </button>
          </div>
        ) : null}
      </main>

      <BottomNav active="map" />

      {lightbox ? (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="画像拡大表示"
          onClick={() => setLightbox(null)}
        >
          {lightbox.storage_url ? (
            <img src={lightbox.storage_url} alt="拡大画像" className="max-h-[90vh] max-w-[90vw] object-contain" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
