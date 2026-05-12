"use client";

import { useEffect, useMemo, useState } from "react";
import { GalleryFab } from "./GalleryFab";
import { GalleryFilterChips } from "./GalleryFilterChips";
import { GalleryGrid } from "./GalleryGrid";
import { GalleryHeader } from "./GalleryHeader";
import { GallerySelectionBar } from "./GallerySelectionBar";
import { TopNav } from "@/components/Nav/TopNav";
import type { GalleryPhoto, GallerySpot } from "./types";
import { BottomNav } from "@/components/Nav/BottomNav";

export function GalleryClient({ spotId }: { spotId: string }) {
  const [spot, setSpot] = useState<GallerySpot | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [selectMode, setSelectMode] = useState(false);

  const isUuid = useMemo(() => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(spotId);
  }, [spotId]);

  const effectiveSpot = isUuid ? spot : null;
  const effectivePhotos = useMemo(() => (isUuid ? photos : []), [isUuid, photos]);
  const effectiveTotal = isUuid ? total : null;
  const effectiveError = !isUuid ? "ギャラリーのIDが不正です（UUIDではありません）。" : error;

  useEffect(() => {
    if (!isUuid) return;
    (async () => {
      const [spotRes, photosRes] = await Promise.all([
        fetch(`/api/spots/${spotId}`, { cache: "no-store" }),
        fetch(`/api/spots/${spotId}/photos?limit=100`, { cache: "no-store" }),
      ]);

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
    })();
  }, [spotId, isUuid]);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return effectivePhotos;
    // SpotPhoto currently doesn't include title/location; filter by date/id for now.
    return effectivePhotos.filter((p) => p.id.toLowerCase().includes(keyword) || p.created_at.toLowerCase().includes(keyword));
  }, [effectivePhotos, q]);

  const selectedCount = selected.size;

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
  };

  return (
    <div className="bg-background text-on-surface min-h-screen pb-24">
      <TopNav query={q} onQueryChange={setQ} />

      <main className="pt-20 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
        <GalleryHeader
          spot={effectiveSpot}
          total={effectiveTotal}
          count={effectivePhotos.length}
          onToggleSelectMode={() => {
            setSelectMode((v) => !v);
            setSelected(new Set());
          }}
        />

        <GalleryFilterChips />

        {effectiveError ? <p className="mb-md text-body-md font-body-md text-error">{effectiveError}</p> : null}

        <GalleryGrid
          photos={filtered}
          spot={effectiveSpot}
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

      <BottomNav active="gallery" galleryHref={`/gallery/${spotId}`} />
    </div>
  );
}

