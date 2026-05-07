"use client";

export function UploadMetaForm({
  stage,
  placeName,
  setPlaceName,
  dateTimeText,
  setDateTimeText,
  description,
  setDescription,
  isPublic,
  setIsPublic,
}: {
  stage: "select" | "review" | "uploading" | "done";
  placeName: string;
  setPlaceName: (v: string) => void;
  dateTimeText: string;
  setDateTimeText: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;
}) {
  const disabled = stage === "uploading";
  return (
    <div className="space-y-3">
      <label className="block space-y-1.5">
        <span className="px-1 text-label-lg font-label-lg text-on-surface-variant">Location Name</span>
        <input
          className="w-full rounded-lg bg-surface-container-low px-4 py-3 text-body-md font-body-md outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container transition-all"
          placeholder="Enter location name"
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          disabled={disabled}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="px-1 text-label-lg font-label-lg text-on-surface-variant">Date &amp; Time</span>
        <input
          className="w-full rounded-lg bg-surface-container-low px-4 py-3 text-body-md font-body-md outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container transition-all"
          placeholder="Enter date"
          value={dateTimeText}
          onChange={(e) => setDateTimeText(e.target.value)}
          disabled={disabled}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="px-1 text-label-lg font-label-lg text-on-surface-variant">Description (Optional)</span>
        <textarea
          className="w-full resize-none rounded-lg bg-surface-container-low px-4 py-3 text-body-md font-body-md outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container transition-all"
          placeholder="Add a caption to your photo..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={disabled}
        />
      </label>

      <div className="rounded-lg bg-surface-container-low p-3 text-body-md font-body-md">
        <div className="font-semibold text-on-surface-variant">公開設定</div>
        <div className="mt-2 flex gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="radio" checked={isPublic} onChange={() => setIsPublic(true)} disabled={disabled} />
            公開
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" checked={!isPublic} onChange={() => setIsPublic(false)} disabled={disabled} />
            非公開
          </label>
        </div>
      </div>
    </div>
  );
}

