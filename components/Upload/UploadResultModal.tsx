"use client";

import { useEffect, useState } from "react";
import AdBanner from "@/components/AdBanner";
import { TipsCard } from "@/components/Tips/TipsCard";
import { useRandomTip } from "@/components/Tips/useRandomTip";

export function UploadResultModal({
  open,
  phase,
  filesTotal,
  uploadingIndex,
  uploadedCount,
  onGoMap,
}: {
  open: boolean;
  phase: "loading" | "done";
  filesTotal: number;
  uploadingIndex: number | null;
  uploadedCount: number;
  onGoMap: () => void;
}) {
  const [entered, setEntered] = useState(false);
  const tipText = useRandomTip(open && phase === "loading");

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = requestAnimationFrame(() => {
      setEntered(true);
    });
    return () => {
      document.body.style.overflow = prevOverflow;
      cancelAnimationFrame(id);
      setEntered(false);
    };
  }, [open]);

  if (!open) return null;

  const currentSlot =
    uploadingIndex != null && filesTotal > 0 ? Math.min(filesTotal, uploadingIndex + 1) : null;

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-result-dialog-title"
      aria-busy={phase === "loading" || undefined}
    >
      <div
        className={`pointer-events-auto absolute inset-0 bg-black/40 transition-opacity duration-100 ease-out ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />
      <div
        className={`pointer-events-auto relative z-10 w-full max-w-md rounded-2xl border border-zinc-300 bg-white p-5 text-black shadow-2xl transition-transform duration-100 ease-out motion-reduce:transition-none motion-reduce:translate-y-0 ${
          entered ? "translate-y-0" : "translate-y-[90vh]"
        }`}
      >
        <h2
          id="upload-result-dialog-title"
          className="text-center text-headline-md font-headline-md font-semibold text-black"
        >
          {phase === "loading" ? "アップロード中" : "アップロード完了！"}
        </h2>

        <div className="relative mt-4 min-h-[220px]">
          <div
            className={`transition-opacity duration-200 ease-out ${
              phase === "loading"
                ? "opacity-100"
                : "pointer-events-none absolute inset-0 opacity-0"
            }`}
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-4 py-6">
              <span
                className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-800"
                aria-hidden
              />
              {currentSlot != null ? (
                <p className="text-center text-body-md font-body-md text-zinc-800">
                  {`${filesTotal}枚中 ${currentSlot}枚目を送信中…`}
                </p>
              ) : null}
              <TipsCard text={tipText} />
              <p className="text-center text-label-md font-label-md text-zinc-600">
                完了 {uploadedCount} / {filesTotal}
              </p>
            </div>
          </div>

          <div
            className={`transition-opacity duration-200 ease-out ${
              phase === "done"
                ? "opacity-100"
                : "pointer-events-none absolute inset-0 opacity-0"
            }`}
          >
            <div className="mt-2 rounded-lg border border-zinc-200 bg-white p-3 text-left">
              <div className="mb-2 text-label-sm font-label-sm text-zinc-700">広告とかね</div>
              <AdBanner />
            </div>
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={onGoMap}
                className="rounded-xl bg-black px-4 py-2.5 text-body-md font-body-md font-semibold text-white transition-colors hover:bg-zinc-800"
              >
                地図で確認する
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
