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
      <span className="text-label-lg font-label-lg">{selectedCount}件を選択中</span>
      <div className="h-6 w-px bg-outline-variant" />
      <div className="flex items-center gap-4">
        <button type="button" className="flex flex-col items-center gap-0.5 hover:text-primary transition-colors" aria-label="共有">
          <span className="material-symbols-outlined text-[20px]">share</span>
          <span className="text-[10px] font-bold tracking-tight">共有</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-0.5 hover:text-primary transition-colors" aria-label="アーカイブ">
          <img
            src="/icons/folder_zip_32dp.svg"
            alt=""
            width={20}
            height={20}
            className="block size-5"
            draggable={false}
          />
          <span className="text-[10px] font-bold tracking-tight">アーカイブ</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-0.5 hover:text-error transition-colors" aria-label="削除">
          <img
            src="/icons/delete_32dp.svg"
            alt=""
            width={20}
            height={20}
            className="block size-5"
            draggable={false}
          />
          <span className="text-[10px] font-bold tracking-tight">削除</span>
        </button>
      </div>
      <button type="button" className="p-1 hover:bg-white/10 rounded-full transition-colors" onClick={onClose} aria-label="閉じる">
        <img
          src="/icons/close_32dp.svg"
          alt=""
          width={20}
          height={20}
          className="block size-5"
          draggable={false}
        />
      </button>
    </div>
  );
}

