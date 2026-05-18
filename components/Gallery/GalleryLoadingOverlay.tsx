"use client";

import { TipsCard } from "@/components/Tips/TipsCard";
import { useRandomTip } from "@/components/Tips/useRandomTip";

export function GalleryLoadingOverlay({
  label = "読み込み中…",
  showTips = true,
}: {
  label?: string;
  showTips?: boolean;
}) {
  const tipText = useRandomTip(showTips);

  return (
    <div
      className="flex min-h-[calc(100dvh-13rem)] w-full items-center justify-center px-4 py-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex w-full max-w-md flex-col items-center">
        <div className="flex flex-col items-center gap-5">
          <div className="dots dots--lg" aria-hidden>
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
          <p className="text-headline-md font-headline-md font-semibold tracking-wide text-on-surface">
            {label}
          </p>
        </div>
        {showTips ? (
          <div className="mt-10 w-full">
            <TipsCard text={tipText} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
