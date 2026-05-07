"use client";

import type { GallerySpot } from "./types";

export function GalleryHeader({
  spot,
  total,
  count,
  onToggleSelectMode,
}: {
  spot: GallerySpot | null;
  total: number | null;
  count: number;
  onToggleSelectMode: () => void;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-lg gap-4">
      <div>
        <h1 className="text-display font-display text-on-surface">{spot?.name ?? "Gallery"}</h1>
        <p className="text-body-md font-body-md text-on-surface-variant">
          {typeof total === "number" ? `${total} items` : `${count} items`} captured here
        </p>
        {spot?.address ? <p className="mt-1 text-body-md font-body-md text-outline">{spot.address}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSelectMode}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high text-on-surface-variant text-label-lg font-label-lg hover:bg-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Select Items
        </button>
        <button
          type="button"
          className="p-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm"
          aria-label="Filter"
        >
          <span className="material-symbols-outlined">tune</span>
        </button>
      </div>
    </div>
  );
}

