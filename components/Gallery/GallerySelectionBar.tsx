"use client";

export function GallerySelectionBar({
  selectedCount,
  onClose,
}: {
  selectedCount: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-6 py-3 rounded-full flex items-center gap-6 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <span className="text-label-lg font-label-lg">{selectedCount} item selected</span>
      <div className="h-6 w-px bg-outline-variant" />
      <div className="flex items-center gap-4">
        <button type="button" className="flex flex-col items-center gap-0.5 hover:text-primary transition-colors" aria-label="Share">
          <span className="material-symbols-outlined text-[20px]">share</span>
          <span className="text-[10px] uppercase font-bold tracking-tighter">Share</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-0.5 hover:text-primary transition-colors" aria-label="Archive">
          <span className="material-symbols-outlined text-[20px]">folder_zip</span>
          <span className="text-[10px] uppercase font-bold tracking-tighter">Archive</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-0.5 hover:text-error transition-colors" aria-label="Delete">
          <span className="material-symbols-outlined text-[20px]">delete</span>
          <span className="text-[10px] uppercase font-bold tracking-tighter">Delete</span>
        </button>
      </div>
      <button type="button" className="p-1 hover:bg-white/10 rounded-full transition-colors" onClick={onClose} aria-label="Close">
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>
  );
}

