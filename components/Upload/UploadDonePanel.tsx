"use client";

import AdBanner from "@/components/AdBanner";

export function UploadDonePanel({
  result,
  onGoMap,
}: {
  result: { spot_id: string; photo_id: string; lat?: number; lng?: number };
  onGoMap: () => void;
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
      <div className="text-sm font-semibold">アップロード完了</div>
      <div className="mt-2 text-label-sm font-label-sm text-outline">
        spot_id: {result.spot_id} / photo_id: {result.photo_id}
      </div>
      <div className="mt-4 rounded-lg border border-outline-variant p-3">
        <div className="mb-2 text-label-sm font-label-sm text-outline">広告</div>
        <AdBanner />
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onGoMap}
          className="rounded-xl bg-primary px-4 py-2 text-body-md font-body-md font-semibold text-on-primary hover:bg-primary-container"
        >
          地図で確認する
        </button>
      </div>
    </div>
  );
}

