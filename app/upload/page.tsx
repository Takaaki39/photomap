"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { extractGpsFromExif } from "@/lib/exif";
import { UploadDonePanel } from "@/components/Upload/UploadDonePanel";
import { UploadFileDrop } from "@/components/Upload/UploadFileDrop";
import { UploadMapCard } from "@/components/Upload/UploadMapCard";
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
  const [files, setFiles] = useState<File[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [isPublic] = useState(true);
  const [placeName, setPlaceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ spot_id: string; photo_id: string; lat?: number; lng?: number } | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);

  const canProceed = useMemo(() => {
    if (files.length === 0) return false;
    if (gps) return true;
    return false;
  }, [files.length, gps]);

  const activeFile = useMemo(() => files[activeIndex] ?? null, [files, activeIndex]);

  const previewUrl = useMemo(() => {
    if (!activeFile) return null;
    return URL.createObjectURL(activeFile);
  }, [activeFile]);

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

  const resetAll = () => {
    setFiles([]);
    setActiveIndex(0);
    setGps(null);
    setStage("select");
    setResult(null);
    setUploadingIndex(null);
    setUploadedCount(0);
  };

  const onPickFiles = async (picked: File[]) => {
    setError(null);
    if (picked.length === 0) return;
    for (const f of picked) {
      const v = validateFile(f);
      if (v) {
        resetAll();
        setError(v);
        return;
      }
    }

    // EXIF(GPS)が無い写真はアップロード対象から除外する
    const withExif: File[] = [];
    const withoutExif: string[] = [];
    for (const f of picked) {
      try {
        const g = await extractGpsFromExif(f);
        if (g) withExif.push(f);
        else withoutExif.push(f.name);
      } catch {
        withoutExif.push(f.name);
      }
    }

    if (withExif.length === 0) {
      resetAll();
      setError("位置情報（EXIF）がある写真が見つかりませんでした。位置情報付きの写真を選択してください。");
      return;
    }

    setFiles(withExif);
    setActiveIndex(0);
    setStage("review");
    void formatLocalDateTime(withExif[0] ?? null);

    // まとめて投稿の基準位置は「1枚目のEXIF(GPS)」
    try {
      const g = await extractGpsFromExif(withExif[0] as File);
      setGps(g);
    } catch {
      setGps(null);
    }

    if (withoutExif.length > 0) {
      setError(`位置情報（EXIF）が無いので除外しました: ${withoutExif.slice(0, 5).join("、")}${withoutExif.length > 5 ? ` ほか${withoutExif.length - 5}件` : ""}`);
    }
  };

  useEffect(() => {
    if (files.length === 0) return;
    if (gps) return;
    if (stage === "uploading" || stage === "done") return;

    // この画面は「EXIF(GPS)必須」なので、端末GPS/IPフォールバックは使わない
    // （メタ情報なし写真が通ってしまうのを防ぐため）
  }, [files.length, gps, stage]);

  const lastAutoFillKeyRef = useRef<string>("");
  useEffect(() => {
    const chosen = gps;
    if (!chosen) return;

    const key = `${chosen.lat.toFixed(6)},${chosen.lng.toFixed(6)}`;
    if (key === lastAutoFillKeyRef.current) return;

    // Don't overwrite user-entered text (only fill when empty, or when last value was auto-filled).
    const canOverwrite = placeName.trim().length === 0 || placeName === lastAutoFillKeyRef.current;
    if (!canOverwrite) {
      lastAutoFillKeyRef.current = key;
      return;
    }

    lastAutoFillKeyRef.current = key;
    void (async () => {
      try {
        const res = await fetch(`/api/geocode/reverse?lat=${encodeURIComponent(String(chosen.lat))}&lng=${encodeURIComponent(String(chosen.lng))}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const d = (await res.json()) as { result?: { name?: string } | null };
        const name = typeof d.result?.name === "string" ? d.result.name.trim() : "";
        if (!name) return;
        setPlaceName((prev) => (prev.trim().length === 0 ? name : prev));
      } catch {
        // ignore
      }
    })();
  }, [gps, placeName]);

  const onDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files ?? []);
    if (list.length > 0) await onPickFiles(list);
  };

  const onSubmit = async () => {
    if (files.length === 0) return;
    if (!canProceed) {
      setError("位置情報が不足しています。GPS付き画像か、手動ピンを選択してください。");
      return;
    }

    setStage("uploading");
    setError(null);
    setUploadedCount(0);

    const chosen = gps;

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i] as File;
      setUploadingIndex(i);

      const fd = new FormData();
      fd.set("file", file);
      fd.set("is_public", String(isPublic));
      fd.set("place_name", placeName);
      fd.set("require_exif_gps", "true");
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

      if (!res.ok) {
        setStage("review");
        setUploadingIndex(null);
        setError(`${i + 1}枚目で失敗: ${errorMessage}`);
        return;
      }

      const spotId = typeof payload.spot_id === "string" ? payload.spot_id : "";
      const photoId = typeof payload.photo_id === "string" ? payload.photo_id : "";
      const resultLat = typeof payload.lat === "number" ? payload.lat : Number(payload.lat);
      const resultLng = typeof payload.lng === "number" ? payload.lng : Number(payload.lng);

      setUploadedCount((c) => c + 1);
      setResult({
        spot_id: spotId,
        photo_id: photoId,
        lat: Number.isFinite(resultLat) ? resultLat : undefined,
        lng: Number.isFinite(resultLng) ? resultLng : undefined,
      });
    }

    setUploadingIndex(null);
    setStage("done");
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <TopNav query={placeName} onQueryChange={() => {}} />

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
                  multiple
                  accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const list = Array.from(e.target.files ?? []);
                    if (list.length > 0) await onPickFiles(list);
                  }}
                />
              </div>
            ) : (
              <UploadPreview
                previewUrl={previewUrl}
                fileLabel={
                  activeFile
                    ? `${activeFile.name} ・ ${formatBytes(activeFile.size)}（${activeIndex + 1}/${files.length}）`
                    : files.length > 0
                      ? `${files.length}枚`
                      : null
                }
              />
            )}
          </section>

          <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
            <div className="flex flex-col gap-4">
              <UploadMapCard
                gps={gps}
                manualLocation={null}
                onChange={() => {
                  // Manual pin picking is disabled for auto-fill mode.
                }}
              />

              {stage === "review" && files.length > 1 ? (
                <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-body-md font-body-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-on-surface-variant">
                      選択中: {activeIndex + 1}/{files.length}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2 text-label-lg font-label-lg text-on-surface-variant hover:bg-surface-container-high transition-colors active:scale-[0.98] disabled:opacity-60"
                        onClick={() => setActiveIndex((v) => Math.max(0, v - 1))}
                        disabled={activeIndex === 0}
                      >
                        前
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2 text-label-lg font-label-lg text-on-surface-variant hover:bg-surface-container-high transition-colors active:scale-[0.98] disabled:opacity-60"
                        onClick={() => setActiveIndex((v) => Math.min(files.length - 1, v + 1))}
                        disabled={activeIndex >= files.length - 1}
                      >
                        次
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                disabled={stage === "select" || stage === "uploading" || files.length === 0 || !canProceed}
                onClick={onSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-4 text-headline-md font-headline-md text-on-primary shadow-[0px_8px_24px_rgba(0,0,0,0.15)] hover:bg-primary-container transition-colors active:scale-[0.99] disabled:opacity-60"
              >
                {stage === "uploading"
                  ? `アップロード中... ${uploadingIndex != null ? `${uploadingIndex + 1}/${files.length}` : ""}（完了: ${uploadedCount}）`
                  : files.length > 1
                    ? `まとめてアップロード（${files.length}枚）`
                    : "アップロードする"}
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
