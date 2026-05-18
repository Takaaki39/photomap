"use client";

import { useEffect, useMemo, useState } from "react";
import { GalleryFab } from "./GalleryFab";
import { GalleryGrid } from "./GalleryGrid";
import { GalleryHeader } from "./GalleryHeader";
import { GallerySelectionBar } from "./GallerySelectionBar";
import { BottomNav } from "@/components/Nav/BottomNav";
import { APP_MAIN_BOTTOM_CLASS, APP_MAIN_TOP_CLASS, TopNav } from "@/components/Nav/TopNav";
import type { GalleryPhoto, GallerySpot } from "./types";
import { refreshAllSpotsSnapshot } from "@/lib/spotsBoundsCache";
import { MergedSpotsGalleryClient } from "@/components/Gallery/MergedSpotsGalleryClient";
import { isMergedSpotsClusterGalleryId, normalizeGalleryRouteId } from "@/lib/galleryRouteId";

export function GalleryClient({ spotId }: { spotId: string }) {
  const id = useMemo(() => normalizeGalleryRouteId(spotId), [spotId]);
  const isMergedGallery = useMemo(() => isMergedSpotsClusterGalleryId(id), [id]);

  const [spot, setSpot] = useState<GallerySpot | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [selectMode, setSelectMode] = useState(false);

  const isUuid = useMemo(() => {
    if (isMergedGallery) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  }, [id, isMergedGallery]);

  const effectiveSpot = isUuid ? spot : null;
  const effectivePhotos = useMemo(() => (isUuid ? photos : []), [isUuid, photos]);
  const effectiveTotal = isUuid ? total : null;
  const effectiveError = !isUuid && !isMergedGallery ? "ギャラリーのIDが不正です（UUIDではありません）。" : error;

  useEffect(() => {
    if (isMergedGallery) return;
    if (!isUuid) {
      setPhotosLoading(false);
      return;
    }
    let cancelled = false;
    setPhotosLoading(true);
    setPhotos([]);
    void (async () => {
      try {
        const [spotRes, photosRes] = await Promise.all([
          fetch(`/api/spots/${id}`, { cache: "no-store" }),
          fetch(`/api/spots/${id}/photos?limit=100`, { cache: "no-store" }),
        ]);

        if (cancelled) return;

        if (spotRes.ok) {
          const d = (await spotRes.json()) as { spot?: GallerySpot };
          setSpot(d.spot ?? null);
        }

        if (!photosRes.ok) {
          const text = await photosRes.text();
          setError(text || "写真の取得に失敗しました。");
          return;
        }
        const d = (await photosRes.json()) as { photos?: GalleryPhoto[]; total?: number | null };
        setPhotos(d.photos ?? []);
        setTotal(typeof d.total === "number" ? d.total : null);
        setError(null);
      } finally {
        if (!cancelled) setPhotosLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isUuid, isMergedGallery]);

  if (isMergedGallery) {
    return <MergedSpotsGalleryClient clusterId={id} />;
  }

  const selectedCount = selected.size;

  const toggleSelected = (entryId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm("この写真を削除しますか？（クラウド上の画像も削除されます）")) return;
    const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
    if (!res.ok) {
      const text = await res.text();
      setError(text || "削除に失敗しました。");
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(photoId);
      return next;
    });
    void refreshAllSpotsSnapshot();
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#111827] scheme-light">
      <TopNav />

      <main
        className={`mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop ${APP_MAIN_TOP_CLASS} ${APP_MAIN_BOTTOM_CLASS}`}
      >
        <GalleryHeader
          spot={effectiveSpot}
          total={effectiveTotal}
          count={effectivePhotos.length}
          onToggleSelectMode={() => {
            setSelectMode((v) => !v);
            setSelected(new Set());
          }}
        />

        {effectiveError ? (
          <p className="mb-6 text-body-md font-body-md text-error">{effectiveError}</p>
        ) : null}

        <GalleryGrid
          photos={effectivePhotos}
          spot={effectiveSpot}
          photosLoading={photosLoading}
          selectMode={selectMode && isUuid}
          selected={selected}
          onToggleSelected={toggleSelected}
          onDeletePhoto={deletePhoto}
        />
      </main>

      <GalleryFab />

      {selectMode && selectedCount > 0 ? (
        <GallerySelectionBar
          selectedCount={selectedCount}
          onClose={() => {
            setSelected(new Set());
            setSelectMode(false);
          }}
        />
      ) : null}

      <BottomNav active="gallery" galleryHref={`/gallery/${encodeURIComponent(id)}`} />
    </div>
  );
}

