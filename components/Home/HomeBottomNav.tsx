"use client";

export function HomeBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe px-4 bg-surface-container-lowest shadow-[0px_4px_12px_rgba(0,0,0,0.10)] border-t border-outline-variant rounded-t-xl backdrop-blur-md">
      <a className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-5 py-1 scale-90 transition-all duration-200" href="#">
        <span className="material-symbols-outlined">map</span>
        <span className="text-label-sm font-label-sm">Map</span>
      </a>
      <a className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-1 hover:text-primary transition-colors" href="#">
        <span className="material-symbols-outlined">grid_view</span>
        <span className="text-label-sm font-label-sm">Gallery</span>
      </a>
      <a className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-1 hover:text-primary transition-colors" href="#">
        <span className="material-symbols-outlined">add_circle</span>
        <span className="text-label-sm font-label-sm">Upload</span>
      </a>
      <a className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-1 hover:text-primary transition-colors" href="#">
        <span className="material-symbols-outlined">person</span>
        <span className="text-label-sm font-label-sm">Profile</span>
      </a>
    </nav>
  );
}

