"use client";

export function HomeMobileSearch() {
  return (
    <div className="absolute left-4 right-4 top-20 z-10 md:hidden">
      <div className="flex items-center bg-surface/95 backdrop-blur shadow-lg rounded-xl p-2">
        <span className="material-symbols-outlined px-2 text-outline">search</span>
        <input className="flex-1 bg-transparent border-none focus:ring-0 text-body-md font-body-md" placeholder="Where to?" type="text" />
      </div>
    </div>
  );
}

