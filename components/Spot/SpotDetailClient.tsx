"use client";

import { useEffect, useMemo, useState } from "react";
import AdBanner from "@/components/AdBanner";

type Spot = {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

type SpotPhoto = {
  id: string;
  user_id: string;
  image_url: string | null;
  storage_url: string | null;
  is_public: boolean;
  created_at: string;
  author_name: string;
};

export function SpotDetailClient({ spotId, currentUserId }: { spotId: string; currentUserId?: string }) {
  const [spot, setSpot] = useState<Spot | null>(null);
  const [photos, setPhotos] = useState<SpotPhoto[]>([]);
  const [lightbox, setLightbox] = useState<SpotPhoto | null>(null);

  useEffect(() => {
    (async () => {
      const [spotRes, photosRes] = await Promise.all([
        fetch(`/api/spots/${spotId}`, { cache: "no-store" }),
        fetch(`/api/spots/${spotId}/photos`, { cache: "no-store" }),
      ]);
      if (spotRes.ok) {
        const d = await spotRes.json();
        setSpot(d.spot ?? null);
      }
      if (photosRes.ok) {
        const d = await photosRes.json();
        setPhotos(d.photos ?? []);
      }
    })();
  }, [spotId]);

  const ownPhotosCount = useMemo(() => photos.filter((p) => p.user_id === currentUserId).length, [photos, currentUserId]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">{spot?.name ?? "スポット詳細"}</h1>
      <p className="mt-2 text-sm text-on-surface-variant">{spot?.address ?? "住所なし"}</p>
      <p className="mt-1 text-xs text-outline">
        座標: {spot?.lat?.toFixed(6) ?? "-"}, {spot?.lng?.toFixed(6) ?? "-"}
      </p>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <article key={photo.id} className="overflow-hidden rounded-lg border">
            <button
              type="button"
              className="block w-full"
              onClick={() => setLightbox(photo)}
              aria-label={`画像を拡大表示: ${photo.author_name}`}
            >
              {photo.image_url ? (
                <img src={photo.image_url} alt={`投稿画像 by ${photo.author_name}`} className="h-52 w-full object-cover" />
              ) : (
                <div className="flex h-52 w-full items-center justify-center bg-surface-container-highest text-xs text-outline">
                  画像を表示できません
                </div>
              )}
            </button>
            <div className="space-y-1 p-3 text-xs">
              <p>投稿者: {photo.author_name}</p>
              <p>投稿日時: {new Date(photo.created_at).toLocaleString("ja-JP")}</p>
              <span
                className={`inline-block rounded px-2 py-0.5 text-[11px] ${
                  photo.is_public
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-surface-container text-on-surface"
                }`}
              >
                {photo.is_public ? "公開" : "非公開"}
              </span>
            </div>
          </article>
        ))}
      </section>

      <div className="mt-8 rounded-lg border p-4">
        <p className="mb-2 text-xs text-outline">広告</p>
        <AdBanner />
      </div>

      {ownPhotosCount > 0 ? (
        <div className="mt-6 flex gap-2">
          <button type="button" className="rounded border border-outline-variant px-3 py-2 text-sm hover:bg-surface-container-high">
            スポット統合
          </button>
          <button type="button" className="rounded border border-outline-variant px-3 py-2 text-sm hover:bg-surface-container-high">
            スポット分割
          </button>
        </div>
      ) : null}

      {lightbox ? (
        <div
          className="fixed inset-0 z-1200 flex items-center justify-center bg-black/80 p-4"
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
    </main>
  );
}

