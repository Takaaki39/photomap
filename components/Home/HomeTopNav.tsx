"use client";

import Link from "next/link";

export function HomeTopNav({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (next: string) => void;
}) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16 bg-surface/90 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-md">
        <span className="text-headline-md font-headline-md font-bold text-primary">GeoLens</span>
      </div>

      <div className="hidden md:flex flex-1 max-w-md mx-xl">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
            search
          </span>
          <input
            className="w-full h-10 pl-10 pr-4 bg-surface-container-low rounded-lg border-none focus:ring-2 focus:ring-primary text-body-md font-body-md outline-none"
            placeholder="Search locations..."
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-md">
        <Link
          href="/me"
          aria-label="Account"
          className="material-symbols-outlined p-2 rounded-full hover:bg-surface-container-high transition-colors text-primary"
        >
          account_circle
        </Link>
      </div>
    </header>
  );
}

