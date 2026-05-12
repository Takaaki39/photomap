"use client";

export function HomeMobileSearch() {
  return (
    <div className="absolute left-4 right-4 top-20 z-10 md:hidden">
      <div className="flex items-center bg-surface-container-lowest/95 dark:bg-surface-container/95 backdrop-blur-md shadow-lg rounded-xl p-2 border border-outline-variant/60 dark:border-outline/40">
        <span className="material-symbols-outlined px-2 text-outline">search</span>
        <input
          className="flex-1 bg-transparent border-none focus:ring-0 text-body-md font-body-md text-on-surface outline-none"
          placeholder="どこへ？"
          type="text"
        />
      </div>
    </div>
  );
}

