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
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-display font-display text-on-surface">{spot?.name ?? "ギャラリー"}</h1>
        <p className="text-body-md font-body-md text-on-surface-variant">
          ここで撮影された写真が{typeof total === "number" ? total : count}件
        </p>
        {spot?.address ? <p className="mt-1 text-body-md font-body-md text-outline">{spot.address}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSelectMode}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high text-on-surface-variant text-label-lg font-label-lg hover:bg-surface-variant transition-colors"
        >
          <img
            src="/icons/check_circle_32dp.svg"
            alt=""
            width={18}
            height={18}
            className="block size-[18px] shrink-0"
            draggable={false}
          />
          写真を選択
        </button>
        <button
          type="button"
          className="p-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm"
          aria-label="フィルター"
        >
          <img
            src="/icons/tune_32dp.svg"
            alt=""
            width={24}
            height={24}
            className="block size-6"
            draggable={false}
          />
        </button>
      </div>
    </div>
  );
}

