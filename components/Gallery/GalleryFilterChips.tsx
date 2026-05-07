"use client";

export function GalleryFilterChips() {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar mb-md">
      <button className="px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container text-label-lg font-label-lg whitespace-nowrap shadow-sm">
        All Photos
      </button>
      {["Recent", "Europe", "Nature", "Architecture", "Favorites"].map((label) => (
        <button
          key={label}
          className="px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant text-label-lg font-label-lg whitespace-nowrap border border-outline-variant hover:border-outline transition-colors"
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

