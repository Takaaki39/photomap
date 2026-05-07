"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PickedLocation } from "@/components/Map/PinPicker";
import { extractGpsFromExif } from "@/lib/exif";
import { UploadDonePanel } from "@/components/Upload/UploadDonePanel";
import { UploadFileDrop } from "@/components/Upload/UploadFileDrop";
import { UploadMapCard } from "@/components/Upload/UploadMapCard";
import { UploadMetaForm } from "@/components/Upload/UploadMetaForm";
import { UploadPreview } from "@/components/Upload/UploadPreview";
import { TopNav } from "@/components/Nav/TopNav";
import { BottomNav } from "@/components/Nav/BottomNav";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
]);

type Stage = "select" | "review" | "uploading" | "done";

function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)}MB`;
}

function formatLocalDateTime(file: File | null) {
  if (!file) return "";
  try {
    return new Date(file.lastModified).toLocaleString("ja-JP");
  } catch {
    return "";
  }
}

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [stage, setStage] = useState<Stage>("select");
  const [file, setFile] = useState<File | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [manualLocation, setManualLocation] = useState<PickedLocation | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [placeName, setPlaceName] = useState("");
  const [dateTimeText, setDateTimeText] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ spot_id: string; photo_id: string; lat?: number; lng?: number } | null>(null);

  const canProceed = useMemo(() => {
    if (!file) return false;
    if (gps) return true;
    if (manualMode && manualLocation) return true;
    return false;
  }, [file, gps, manualMode, manualLocation]);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const validateFile = (f: File) => {
    if (!ALLOWED_MIME.has(f.type)) {
      return "対応形式は JPEG / PNG / HEIC / WebP です。";
    }
    if (f.size > MAX_BYTES) {
      return `ファイルサイズが大きすぎます（最大20MB）。現在: ${formatBytes(f.size)}`;
    }
    return null;
  };

  const onPickFile = async (f: File) => {
    setError(null);
    const v = validateFile(f);
    if (v) {
      setFile(null);
      setGps(null);
      setManualLocation(null);
      setManualMode(false);
      setStage("select");
      setError(v);
      return;
    }

    setFile(f);
    setStage("review");
    setManualMode(false);
    setManualLocation(null);
    setDateTimeText(formatLocalDateTime(f));

    try {
      const g = await extractGpsFromExif(f);
      setGps(g);
      if (!g) {
        setManualMode(true);
      }
    } catch {
      setGps(null);
      setManualMode(true);
    }
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      await onPickFile(dropped);
    }
  };

  const onSubmit = async () => {
    if (!file) return;
    if (!canProceed) {
      setError("位置情報が不足しています。GPS付き画像か、手動ピンを選択してください。");
      return;
    }

    setStage("uploading");
    setError(null);

    const fd = new FormData();
    fd.set("file", file);
    fd.set("is_public", String(isPublic));
    fd.set("place_name", placeName);

    const chosen = gps ?? (manualMode ? manualLocation : null);
    if (chosen) {
      fd.set("client_lat", String(chosen.lat));
      fd.set("client_lng", String(chosen.lng));
    }

    const res = await fetch("/api/photos/upload", { method: "POST", body: fd });

    const raw = await res.text();
    const payload = (() => {
      if (!raw) return {} as Record<string, unknown>;
      try {
        return JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return { error: raw } as Record<string, unknown>;
      }
    })();

    const errorMessage =
      (typeof payload.error === "string" && payload.error) ||
      (typeof payload.message === "string" && payload.message) ||
      (raw ? "アップロードに失敗しました。" : "アップロードに失敗しました（サーバー応答が空です）。");

    const spotId = typeof payload.spot_id === "string" ? payload.spot_id : "";
    const photoId = typeof payload.photo_id === "string" ? payload.photo_id : "";
    const resultLat = typeof payload.lat === "number" ? payload.lat : Number(payload.lat);
    const resultLng = typeof payload.lng === "number" ? payload.lng : Number(payload.lng);
    if (!res.ok) {
      if (res.status === 422) {
        setManualMode(true);
        setStage("review");
        setError(errorMessage || "GPS情報がありません。手動で場所を入力してください。");
        return;
      }
      setStage("review");
      setError(errorMessage);
      return;
    }

    setResult({
      spot_id: spotId,
      photo_id: photoId,
      lat: Number.isFinite(resultLat) ? resultLat : undefined,
      lng: Number.isFinite(resultLng) ? resultLng : undefined,
    });
    setStage("done");
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <TopNav query={placeName} onQueryChange={setPlaceName} />

      <main className="mx-auto w-full max-w-7xl px-margin-mobile pb-24 pt-24 md:px-margin-desktop">
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <section className="lg:col-span-7 xl:col-span-8">
            {stage === "select" ? (
              <div className="space-y-4">
                <UploadFileDrop onDrop={onDrop} onPickClick={() => inputRef.current?.click()} />
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) await onPickFile(f);
                  }}
                />
              </div>
            ) : (
              <UploadPreview previewUrl={previewUrl} fileLabel={file ? `${file.name} ・ ${formatBytes(file.size)}` : null} />
            )}
          </section>

          <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
            <div className="flex flex-col gap-4">
              <UploadMapCard
                gps={gps}
                manualLocation={manualLocation}
                onChange={(v) => {
                  setManualMode(true);
                  setManualLocation(v);
                  setGps(null);
                }}
              />

              <UploadMetaForm
                stage={stage}
                placeName={placeName}
                setPlaceName={setPlaceName}
                dateTimeText={dateTimeText}
                setDateTimeText={setDateTimeText}
                description={description}
                setDescription={setDescription}
                isPublic={isPublic}
                setIsPublic={setIsPublic}
              />

              <button
                type="button"
                disabled={stage === "select" || stage === "uploading" || !file || !canProceed}
                onClick={onSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-headline-md font-headline-md text-on-primary shadow-lg shadow-primary/20 hover:bg-primary-container hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-60"
              >
                {stage === "uploading" ? "アップロード中..." : "Confirm & Post"}
              </button>

              <p className="px-4 text-center text-label-sm font-label-sm text-outline">
                投稿すると、位置情報を含むデータの取り扱いに同意したものとみなされます。
              </p>

              {stage === "done" && result ? (
                <UploadDonePanel
                  result={result}
                  onGoMap={() => {
                    const sp = result?.spot_id;
                    const lat = result?.lat;
                    const lng = result?.lng;
                    if (sp && typeof lat === "number" && typeof lng === "number") {
                      const q = new URLSearchParams({
                        spot_id: sp,
                        lat: String(lat),
                        lng: String(lng),
                        zoom: "16",
                      });
                      router.push(`/?${q.toString()}`);
                      return;
                    }
                    router.push("/");
                  }}
                />
              ) : null}
            </div>
          </aside>
        </div>
      </main>

      <BottomNav active="upload" />
    </div>
  );
}
