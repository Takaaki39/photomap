"use client";

export function HomeZoomControl({
  active,
  onSelectZoom,
}: {
  active: "city" | "prefecture" | "region" | "country" | "world";
  onSelectZoom: (zoom: number) => void;
}) {
  return (
    <div className="absolute top-24 right-4 md:top-24 md:right-8 z-20 flex flex-col gap-2">
      <div className="bg-surface-container-lowest/95 dark:bg-surface-container/95 backdrop-blur-md shadow-lg rounded-xl p-1 flex flex-col overflow-hidden border border-outline-variant/60 dark:border-outline/40">
        <button
          type="button"
          onClick={() => onSelectZoom(14)}
          className={`p-3 text-label-sm font-label-sm border-b border-outline-variant ${
            active === "city" ? "bg-primary text-on-primary font-bold" : "hover:bg-primary/10 text-on-surface-variant"
          }`}
        >
          市
        </button>
        <button
          type="button"
          onClick={() => onSelectZoom(11)}
          className={`p-3 text-label-sm font-label-sm border-b border-outline-variant ${
            active === "prefecture" ? "bg-primary text-on-primary font-bold" : "hover:bg-primary/10 text-on-surface-variant"
          }`}
        >
          県
        </button>
        <button
          type="button"
          onClick={() => onSelectZoom(8)}
          className={`p-3 text-label-sm font-label-sm border-b border-outline-variant ${
            active === "region" ? "bg-primary text-on-primary font-bold" : "hover:bg-primary/10 text-on-surface-variant"
          }`}
        >
          地方
        </button>
        <button
          type="button"
          onClick={() => onSelectZoom(5)}
          className={`p-3 text-label-sm font-label-sm border-b border-outline-variant ${
            active === "country" ? "bg-primary text-on-primary font-bold" : "hover:bg-primary/10 text-on-surface-variant"
          }`}
        >
          国
        </button>
        <button
          type="button"
          onClick={() => onSelectZoom(2)}
          className={`p-3 text-label-sm font-label-sm ${
            active === "world" ? "bg-primary text-on-primary font-bold" : "hover:bg-primary/10 text-on-surface-variant"
          }`}
        >
          世界
        </button>
      </div>
    </div>
  );
}

