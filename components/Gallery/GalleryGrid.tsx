"use client";

import { useMemo, useState } from "react";
import type { GalleryPhoto, GallerySpot } from "./types";
import { PhotoLightbox } from "@/components/Photo/PhotoLightbox";
import { formatGalleryPhotoDate } from "@/lib/galleryPhotoDate";
import { GalleryLoadingOverlay } from "@/components/Gallery/GalleryLoadingOverlay";
import { useGalleryFirstImageReady } from "@/components/Gallery/useGalleryFirstImageReady";

export function GalleryGrid({
  photos,
  spot,
  selectMode,
  selected,
  onToggleSelected,
  onDeletePhoto,
  photosLoading = false,
}: {
  photos: GalleryPhoto[];
  spot: GallerySpot | null;
  selectMode: boolean;
  selected: Set<string>;
  onToggleSelected: (id: string) => void;
  onDeletePhoto?: (photoId: string) => void;
  photosLoading?: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activePhoto = useMemo(() => photos.find((p) => p.id === activeId) ?? null, [activeId, photos]);
  const { showGalleryLoading } = useGalleryFirstImageReady(photos, photosLoading);

  if (showGalleryLoading) {
    return <GalleryLoadingOverlay />;
  }

  if (photos.length === 0) {
    return (
      <p className="py-12 text-center text-body-md font-body-md text-on-surface-variant">
        写真がありません
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
        {photos.map((photo) => {
        const isSelected = selected.has(photo.id);
        const cardRing =
          selectMode && isSelected
            ? "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary/30"
            : "";
        return (
          <div
            key={photo.id}
            onClick={() => {
              if (selectMode) onToggleSelected(photo.id);
              else setActiveId(photo.id);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              if (selectMode) onToggleSelected(photo.id);
              else setActiveId(photo.id);
            }}
            className={`group relative flex flex-col text-left overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface-container-lowest shadow-[0_1px_2px_rgba(24,28,32,0.06),0_6px_20px_rgba(24,28,32,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-outline/60 hover:shadow-[0_2px_6px_rgba(24,28,32,0.08),0_12px_28px_rgba(24,28,32,0.12)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_8px_24px_rgba(0,0,0,0.45)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.5),0_16px_40px_rgba(0,0,0,0.55)] ${cardRing}`}
            role="button"
            tabIndex={0}
          >
            <div className="relative aspect-video w-full overflow-hidden bg-surface-container-high">
              {photo.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  src={photo.image_url}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-label-sm font-label-sm text-outline">
                  画像なし
                </div>
              )}
            </div>
            <div className="border-t border-outline-variant/50 bg-surface-container-lowest p-3">
              <div className="mb-1 flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 text-label-sm font-label-sm font-semibold text-primary">場所</span>
                <span className="truncate text-label-sm font-label-sm text-on-surface">
                  {spot?.name ?? "スポット"}
                </span>
              </div>
              <p className="text-label-sm font-label-sm text-outline">{formatGalleryPhotoDate(photo)}</p>
            </div>

            {!selectMode && onDeletePhoto ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePhoto(photo.id);
                }}
                className="absolute top-2 left-2 z-10 rounded-full border border-outline-variant/60 bg-surface-container-lowest/95 p-1 shadow-md backdrop-blur-md hover:bg-surface-container-lowest transition-colors"
                aria-label="削除"
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
            ) : null}

            {selectMode ? (
              <div className="absolute top-2 right-2 transition-opacity">
                {isSelected ? (
                  <div className="bg-primary p-1 rounded-full shadow-sm">
                    <img
                      src="/icons/check_circle_32dp.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="block size-5 brightness-0 invert"
                      draggable={false}
                    />
                  </div>
                ) : (
                  <div className="bg-surface/80 backdrop-blur-md p-1 rounded-full shadow-sm">
                    <img
                      src="/icons/radio_button_unchecked_32dp.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="block size-5"
                      draggable={false}
                    />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        );
        })}
      </div>

      <PhotoLightbox
        open={Boolean(activePhoto?.image_url)}
        src={activePhoto?.image_url ?? null}
        alt={spot?.name ?? ""}
        onClose={() => setActiveId(null)}
      />
    </>
  );
}

