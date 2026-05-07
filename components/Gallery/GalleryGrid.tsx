"use client";

import type { GalleryPhoto, GallerySpot } from "./types";

export function GalleryGrid({
  photos,
  spot,
  selectMode,
  selected,
  onToggleSelected,
}: {
  photos: GalleryPhoto[];
  spot: GallerySpot | null;
  selectMode: boolean;
  selected: Set<string>;
  onToggleSelected: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
      {photos.map((photo) => {
        const isSelected = selected.has(photo.id);
        const cardRing = selectMode && isSelected ? "ring-2 ring-primary shadow-[0px_4px_12px_rgba(0,0,0,0.1)]" : "";
        return (
          <button
            key={photo.id}
            type="button"
            onClick={() => {
              if (selectMode) onToggleSelected(photo.id);
            }}
            className={`group relative text-left bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0px_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[0px_4px_12px_rgba(0,0,0,0.1)] transition-all ${cardRing}`}
          >
            <div className="aspect-video w-full bg-surface-container-highest">
              {photo.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="w-full h-full object-cover" src={photo.image_url} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-label-sm font-label-sm text-outline">
                  No image
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-center gap-1 text-primary mb-1">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                <span className="text-label-sm font-label-sm">{spot?.name ?? "Spot"}</span>
              </div>
              <p className="text-label-lg font-label-lg text-on-surface truncate">{photo.id}</p>
              <p className="text-label-sm font-label-sm text-outline">{new Date(photo.created_at).toLocaleDateString("ja-JP")}</p>
            </div>

            {selectMode ? (
              <div className="absolute top-2 right-2 transition-opacity">
                {isSelected ? (
                  <div className="bg-primary p-1 rounded-full shadow-sm">
                    <span
                      className="material-symbols-outlined text-on-primary"
                      style={{ fontVariationSettings: "'FILL' 1" } as React.CSSProperties}
                    >
                      check_circle
                    </span>
                  </div>
                ) : (
                  <div className="bg-surface/80 backdrop-blur-md p-1 rounded-full shadow-sm">
                    <span className="material-symbols-outlined text-on-surface-variant">radio_button_unchecked</span>
                  </div>
                )}
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

