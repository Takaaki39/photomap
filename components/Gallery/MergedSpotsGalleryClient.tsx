"use client";

import { useEffect, useMemo, useState } from "react";
import { TopNav } from "@/components/Nav/TopNav";
import { BottomNav } from "@/components/Nav/BottomNav";
import { GalleryGrid } from "@/components/Gallery/GalleryGrid";
import type { GalleryPhoto, GallerySpot } from "@/components/Gallery/types";
import { clearSpotsBoundsCache } from "@/lib/spotsBoundsCache";
import { normalizeGalleryRouteId } from "@/lib/galleryRouteId";

const PREFIX = "cluster:spots~";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export function MergedSpotsGalleryClient({ clusterId }: { clusterId: string }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    if (spotIds.length === 0) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/photos/by-spots?ids=${encodeURIComponent(spotIds.join(","))}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const t = await res.text();
        if (!cancelled) setError(t || "写真の取得に失敗しました。");
        return;
      }
      const d = (await res.json()) as { photos?: GalleryPhoto[]; total?: number };
      if (cancelled) return;
      setPhotos(d.photos ?? []);
      setTotal(typeof d.total === "number" ? d.total : null);
      setError(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [spotIds]);

  const deletePhoto = async (photoId: string) => {
    if (!confirm("この写真を削除しますか？（クラウド上の画像も削除されます）")) return;
    const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
    if (!res.ok) {
      await res.text();
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setTotal((prev) => (typeof prev === "number" ? Math.max(0, prev - 1) : prev));
    clearSpotsBoundsCache();
  };

  const derivedError =
    spotIds.length === 0 ? "まとめ表示のスポットIDが不正です。" : error;

  const galleryHref = `/gallery/${encodeURIComponent(canonicalClusterId)}`;

  return (
    <div className="min-h-screen bg-background pb-24 text-on-surface">
      <TopNav />

      <main className="mx-auto max-w-7xl px-margin-mobile pt-20 md:px-margin-desktop">
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
          selectMode={false}
          selected={new Set()}
          onToggleSelected={() => {}}
          onDeletePhoto={deletePhoto}
        />
      </main>

      <BottomNav active="gallery" galleryHref={galleryHref} />
    </div>
  );
}
