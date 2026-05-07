"use client";

import { PinPicker, type PickedLocation } from "@/components/Map/PinPicker";

export function UploadMapCard({
  gps,
  manualLocation,
  onChange,
}: {
  gps: { lat: number; lng: number } | null;
  manualLocation: PickedLocation | null;
  onChange: (v: PickedLocation) => void;
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-base shadow-md">
      <div className="mb-4 overflow-hidden rounded-lg">
        <div className="h-48 w-full">
          <PinPicker value={manualLocation ?? (gps ? { lat: gps.lat, lng: gps.lng } : null)} onChange={onChange} />
        </div>
      </div>
      <div className="px-2 pb-2">
        <div className="text-label-sm font-label-sm text-primary uppercase">Identified Location</div>
        <div className="text-body-md font-body-md font-bold">
          {gps
            ? `EXIF（${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}）`
            : manualLocation
              ? `手動（${manualLocation.lat.toFixed(4)}, ${manualLocation.lng.toFixed(4)}）`
              : "未設定"}
        </div>
      </div>
    </div>
  );
}

