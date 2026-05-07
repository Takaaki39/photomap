"use client";

import Link from "next/link";

export function GalleryTopNav({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (next: string) => void;
}) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16 bg-surface/90 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-headline-md font-headline-md font-bold text-primary">
          GeoLens
        </Link>
        <div className="hidden md:flex items-center gap-2 bg-surface-container-low/80 px-3 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-outline text-[20px]">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-body-md font-body-md w-64 placeholder:text-outline"
            placeholder="Search specific photos..."
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="md:hidden p-2 rounded-full hover:bg-surface-container-high transition-colors"
          onClick={() => {
            // mobile search UI is omitted for now
          }}
          aria-label="Search"
        >
          <span className="material-symbols-outlined text-on-surface-variant">search</span>
        </button>
        <Link
          href="/me"
          className="p-2 rounded-full hover:bg-surface-container-high transition-all active:scale-95 duration-150"
          aria-label="Account"
        >
          <span className="material-symbols-outlined text-primary">account_circle</span>
        </Link>
      </div>
    </header>
  );
}

