"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/Nav/BottomNav";
import { APP_MAIN_BOTTOM_CLASS, APP_MAIN_TOP_CLASS, TopNav } from "@/components/Nav/TopNav";
import { GalleryGrid } from "@/components/Gallery/GalleryGrid";
import type { GalleryPhoto, GallerySpot } from "@/components/Gallery/types";
import { fetchPhotosBySpots } from "@/features/gallery/api/galleryApi";
import { useDeleteGalleryPhoto } from "@/features/gallery/hooks/useDeleteGalleryPhoto";
import { normalizeGalleryRouteId } from "@/lib/galleryRouteId";

const PREFIX = "cluster:spots~";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export function MergedSpotsGalleryClient({ clusterId }: { clusterId: string }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photosLoading, setPhotosLoading] = useState(true);
  const deleteGalleryPhoto = useDeleteGalleryPhoto({ onError: setError });

  const canonicalClusterId = useMemo(() => normalizeGalleryRouteId(clusterId), [clusterId]);

  const spotIds = useMemo(() => {
    if (!canonicalClusterId.startsWith(PREFIX)) return [];
    return canonicalClusterId
      .slice(PREFIX.length)
      .split("~")
      .map((s) => s.trim())
      .filter(isUuid);
  }, [canonicalClusterId]);

  const spot: GallerySpot | null = useMemo(() => {
    if (spotIds.length === 0) return null;
    return {
      id: canonicalClusterId,
      name: `${spotIds.length}件のスポット`,
      address: null,
    };
  }, [canonicalClusterId, spotIds.length]);

  useEffect(() => {
    if (spotIds.length === 0) {
      setPhotosLoading(false);
      return;
    }
    let cancelled = false;
    setPhotosLoading(true);
    setPhotos([]);
    void (async () => {
      try {
        const result = await fetchPhotosBySpots(spotIds);
        if (cancelled) return;
        if ("error" in result) {
          setError(result.error);
          return;
        }
        setPhotos(result.photos);
        setTotal(result.total);
        setError(null);
      } finally {
        if (!cancelled) setPhotosLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spotIds]);

  const deletePhoto = async (photoId: string) => {
    const ok = await deleteGalleryPhoto(photoId);
    if (!ok) return;
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setTotal((prev) => (typeof prev === "number" ? Math.max(0, prev - 1) : prev));
  };

  const derivedError =
    spotIds.length === 0 ? "まとめ表示のスポットIDが不正です。" : error;

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#111827] scheme-light">
      <TopNav />

      <main
        className={`mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop ${APP_MAIN_TOP_CLASS} ${APP_MAIN_BOTTOM_CLASS}`}
      >
        <div className="mb-6">
          <h1 className="text-headline-lg font-headline-lg text-on-surface">ギャラリー</h1>
          <p className="text-body-md font-body-md text-on-surface-variant">
            重なったスポットの写真 / {total ?? photos.length}件
          </p>
        </div>

        {derivedError ? <p className="mb-md text-body-md font-body-md text-error">{derivedError}</p> : null}

        <GalleryGrid
          photos={photos}
          spot={spot}
          photosLoading={photosLoading}
          selectMode={false}
          selected={new Set()}
          onToggleSelected={() => {}}
          onDeletePhoto={deletePhoto}
        />
      </main>

      <BottomNav active="none" />
    </div>
  );
}
