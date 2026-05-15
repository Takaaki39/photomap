"use client";

import { useEffect, useMemo, useState } from "react";
import { TopNav } from "@/components/Nav/TopNav";
import { BottomNav } from "@/components/Nav/BottomNav";
import { GalleryGrid } from "@/components/Gallery/GalleryGrid";
import type { GalleryPhoto, GallerySpot } from "@/components/Gallery/types";
import { clearSpotsBoundsCache } from "@/lib/spotsBoundsCache";

function cellSizeFromZoom(zoom: number) {
  return zoom <= 3 ? 8 : zoom <= 6 ? 3 : zoom <= 9 ? 1 : zoom <= 12 ? 0.3 : zoom <= 15 ? 0.08 : 0;
}

function readLastZoom(): number {
  if (typeof window === "undefined") return 11;
  try {
    const raw = window.localStorage.getItem("home:lastView");
    if (!raw) return 11;
    const d = JSON.parse(raw) as { zoom?: number };
    if (typeof d.zoom !== "number" || !Number.isFinite(d.zoom)) return 11;
    return Math.max(2, Math.min(18, d.zoom));
  } catch {
    return 11;
  }
}

export function ClusterGalleryClient({ clusterId }: { clusterId: string }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [total, setTotal] = useState<number | null>(null);

  const parsed = useMemo(() => {
    const m = clusterId.match(/^cluster:(-?\d+):(-?\d+)$/);
    if (!m) return null;
    return { latIndex: Number(m[1]), lngIndex: Number(m[2]) };
  }, [clusterId]);

  const derivedError = useMemo(() => {
    if (!parsed) return "クラスタIDが不正です。";
    const zoom = typeof window === "undefined" ? 11 : readLastZoom();
    const cellSize = cellSizeFromZoom(zoom);
    if (cellSize === 0) return "拡大しすぎてクラスタが作れません。マップに戻って少しズームアウトしてください。";
    return null;
  }, [parsed]);

  const spot: GallerySpot | null = useMemo(() => {
    return parsed
      ? {
          id: clusterId,
          name: "このエリア",
          address: null,
        }
      : null;
  }, [clusterId, parsed]);

  useEffect(() => {
    if (!parsed) return;
    const zoom = readLastZoom();
    const cellSize = cellSizeFromZoom(zoom);
    if (cellSize === 0) return;

    const south = parsed.latIndex * cellSize;
    const west = parsed.lngIndex * cellSize;
    const north = (parsed.latIndex + 1) * cellSize;
    const east = (parsed.lngIndex + 1) * cellSize;

    const bounds = `${south},${west},${north},${east}`;

    (async () => {
      const res = await fetch(`/api/photos/in-bounds?bounds=${encodeURIComponent(bounds)}&limit=100`, { cache: "no-store" });
      if (!res.ok) {
        await res.text();
        setPhotos([]);
        setTotal(null);
        return;
      }
      const d = (await res.json()) as { photos?: GalleryPhoto[]; total?: number | null };
      setPhotos(d.photos ?? []);
      setTotal(typeof d.total === "number" ? d.total : null);
    })();
  }, [clusterId, parsed]);

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

  return (
    <div className="bg-background text-on-surface min-h-screen pb-24">
      <TopNav />

      <main className="pt-20 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-headline-lg font-headline-lg text-on-surface">ギャラリー</h1>
          <p className="text-body-md font-body-md text-on-surface-variant">
            {spot?.name ?? "このエリア"} / {total ?? photos.length}件
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

      <BottomNav active="gallery" galleryHref={`/gallery/${clusterId}`} />
    </div>
  );
}

