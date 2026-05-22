"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { extractGpsFromExif } from "@/lib/exif";
import { refreshAllSpotsSnapshot } from "@/lib/spotsBoundsCache";
import { uploadPhotoViaStorage } from "@/lib/uploadPhotoClient";
import { UploadResultModal } from "@/components/Upload/UploadResultModal";
import { UploadFileDrop } from "@/components/Upload/UploadFileDrop";
import { UploadLocationCard } from "@/components/Upload/UploadLocationCard";
import { UploadPreview } from "@/components/Upload/UploadPreview";
import { UploadTagPicker } from "@/components/Upload/UploadTagPicker";
import { BottomNav } from "@/components/Nav/BottomNav";
import { APP_MAIN_BOTTOM_CLASS, APP_MAIN_TOP_CLASS, TopNav } from "@/components/Nav/TopNav";

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
  // files と長さ・順序が一致する各写真の EXIF GPS。GPS 無しのファイルは選択時に除外している
  const [gpsList, setGpsList] = useState<Array<{ lat: number; lng: number }>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPublic] = useState(true);
  const [placeName, setPlaceName] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ spot_id: string; photo_id: string; lat?: number; lng?: number } | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);

  const canProceed = useMemo(() => {
    return files.length > 0 && gpsList.length === files.length;
  }, [files.length, gpsList.length]);

  const activeFile = useMemo(() => files[activeIndex] ?? null, [files, activeIndex]);
  const activeGps = useMemo(() => gpsList[activeIndex] ?? null, [gpsList, activeIndex]);

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
    setGpsList([]);
    setActiveIndex(0);
    setStage("select");
    setResult(null);
    setUploadingIndex(null);
    setUploadedCount(0);
    setTag(null);
  };

  const onPickFiles = async (picked: File[]) => {
    setError(null);
    if (picked.length === 0) return;
    const keepOnPickFailure = stage === "review" && files.length > 0;

    for (const f of picked) {
      const v = validateFile(f);
      if (v) {
        if (keepOnPickFailure) setError(v);
        else {
          resetAll();
          setError(v);
        }
        return;
      }
    }

    // EXIF(GPS)が無い写真はアップロード対象から除外する。GPS は写真ごとに保持する
    const accepted: Array<{ file: File; gps: { lat: number; lng: number } }> = [];
    const withoutExif: string[] = [];
    for (const f of picked) {
      try {
        const g = await extractGpsFromExif(f);
        if (g) accepted.push({ file: f, gps: g });
        else withoutExif.push(f.name);
      } catch {
        withoutExif.push(f.name);
      }
    }

    if (accepted.length === 0) {
      const msg =
        "位置情報（EXIF）がある写真が見つかりませんでした。位置情報付きの写真を選択してください。";
      if (keepOnPickFailure) setError(msg);
      else {
        resetAll();
        setError(msg);
      }
      return;
    }

    setFiles(accepted.map((a) => a.file));
    setGpsList(accepted.map((a) => a.gps));
    setActiveIndex(0);
    setStage("review");
    // ローカル日時の整形は副作用無し（プレビューラベル用途で残存）
    void formatLocalDateTime(accepted[0]?.file ?? null);

    if (withoutExif.length > 0) {
      setError(`位置情報（EXIF）が無いので除外しました: ${withoutExif.slice(0, 5).join("、")}${withoutExif.length > 5 ? ` ほか${withoutExif.length - 5}件` : ""}`);
    }
  };

  const lastAutoFillKeyRef = useRef<string>("");
  useEffect(() => {
    const chosen = activeGps;
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
  }, [activeGps, placeName]);

  const onDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files ?? []);
    if (list.length > 0) await onPickFiles(list);
  };

  const onSubmit = async () => {
    if (stage === "uploading") return;
    if (files.length === 0) return;
    if (!canProceed) {
      setError("位置情報が不足しています。位置情報（EXIF）付きの写真を選んでください。");
      return;
    }

    setStage("uploading");
    setError(null);
    setUploadedCount(0);

    const isBatch = files.length > 1;
    // Nominatim 利用規約: 1 req/sec。サーバ側 reverse-geocode は写真ごとに走るため、
    // バッチ時はクライアントで 1 枚ごとの開始間隔を 1.1 秒以上空けてレートを守る。
    const REVERSE_GEOCODE_MIN_INTERVAL_MS = 1100;
    let lastStartedAt = 0;

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const photoGps = gpsList[i];
      if (!file || !photoGps) continue;

      if (i > 0) {
        const since = Date.now() - lastStartedAt;
        if (since < REVERSE_GEOCODE_MIN_INTERVAL_MS) {
          await new Promise((r) => setTimeout(r, REVERSE_GEOCODE_MIN_INTERVAL_MS - since));
        }
      }
      lastStartedAt = Date.now();
      setUploadingIndex(i);

      try {
        const payload = await uploadPhotoViaStorage({
          file,
          // 各写真の EXIF GPS をそのまま使う（まとめてアップロードでも 1 枚目の位置に寄せない）
          lat: photoGps.lat,
          lng: photoGps.lng,
          // バッチ時は手入力 placeName を全写真に流用するとスポット名がズレるため、空文字でサーバ側 reverse-geocode に任せる
          placeName: isBatch ? "" : placeName,
          isPublic,
          tag,
        });

        setUploadedCount((c) => c + 1);
        setResult({
          spot_id: payload.spot_id,
          photo_id: payload.photo_id,
          lat: payload.lat,
          lng: payload.lng,
        });
      } catch (e) {
        setStage("review");
        setUploadingIndex(null);
        const msg = e instanceof Error ? e.message : "アップロードに失敗しました。";
        setError(`${i + 1}枚目で失敗: ${msg}`);
        return;
      }
    }

    await refreshAllSpotsSnapshot();

    setUploadingIndex(null);
    setStage("done");
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#111827] scheme-light">
      <TopNav />

      <main
        className={`mx-auto w-full max-w-7xl px-margin-mobile md:px-margin-desktop ${APP_MAIN_TOP_CLASS} ${APP_MAIN_BOTTOM_CLASS}`}
      >
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <section className="lg:col-span-7 xl:col-span-8">
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
              className="hidden"
              onChange={async (e) => {
                const list = Array.from(e.target.files ?? []);
                e.target.value = "";
                if (list.length > 0) await onPickFiles(list);
              }}
            />
            {stage === "select" ? (
              <div className="space-y-4">
                <UploadFileDrop onDrop={onDrop} onPickClick={() => inputRef.current?.click()} />
              </div>
            ) : (
              <UploadPreview
                previewUrl={previewUrl}
                pickable={stage === "review"}
                onRequestPick={() => inputRef.current?.click()}
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
              <UploadLocationCard gps={activeGps} />

              {stage === "review" ? (
                <UploadTagPicker value={tag} onChange={setTag} />
              ) : null}

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

              <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-3 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
                <p className="mb-2 px-1 text-label-sm font-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                  投稿する
                </p>
                <button
                  type="button"
                  aria-busy={stage === "uploading" || undefined}
                  disabled={stage === "select" || files.length === 0 || !canProceed}
                  onClick={onSubmit}
                  className="group relative flex w-full items-center gap-4 overflow-hidden rounded-xl px-4 py-4 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-busy:pointer-events-none aria-busy:cursor-wait disabled:cursor-not-allowed disabled:border-2 disabled:border-dashed disabled:border-outline-variant disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:shadow-none enabled:cursor-pointer enabled:border-2 enabled:border-white/30 enabled:bg-primary enabled:text-on-primary enabled:shadow-[0_12px_40px_-8px_rgba(0,88,189,0.45)] enabled:hover:-translate-y-0.5 enabled:hover:border-white/50 enabled:hover:bg-primary-container enabled:hover:shadow-[0_16px_48px_-6px_rgba(0,88,189,0.5)] enabled:active:translate-y-0 enabled:active:shadow-[0_8px_28px_-6px_rgba(0,88,189,0.4)] dark:enabled:shadow-[0_12px_40px_-8px_rgba(173,198,255,0.25)] dark:enabled:hover:shadow-[0_16px_48px_-6px_rgba(173,198,255,0.32)]"
                >
                  <span
                    aria-hidden
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-on-primary transition-colors group-hover:bg-white/25 group-disabled:bg-surface-container group-disabled:text-on-surface-variant"
                  >
                    {stage === "uploading" ? (
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-headline-md font-headline-md leading-tight">
                      {stage === "uploading"
                        ? `アップロード中… ${uploadingIndex != null ? `${uploadingIndex + 1}/${files.length}` : ""}（完了 ${uploadedCount}）`
                        : files.length > 1
                          ? `まとめて投稿する（${files.length}枚）`
                          : "この内容でアップロード"}
                    </span>
                    <span className="mt-1 block text-label-md font-label-md opacity-90">
                      {stage === "uploading"
                        ? "完了までこの画面を閉じないでください"
                        : stage === "select" || files.length === 0
                          ? "写真を選ぶと有効になります"
                          : "タップでスポットに写真を追加します"}
                    </span>
                  </span>
                  {stage !== "uploading" && files.length > 0 && canProceed ? (
                    <span
                      aria-hidden
                      className="hidden shrink-0 rounded-full bg-white/20 px-3 py-1.5 text-label-sm font-label-sm text-on-primary sm:inline-block"
                    >
                      {files.length}枚
                    </span>
                  ) : null}
                </button>
              </div>

              <p className="px-4 text-center text-label-sm font-label-sm text-outline">
                投稿すると、位置情報を含むデータの取り扱いに同意したものとみなされます。
              </p>
            </div>
          </aside>
        </div>
      </main>

      <UploadResultModal
        open={stage === "uploading" || stage === "done"}
        phase={stage === "done" ? "done" : "loading"}
        filesTotal={files.length}
        uploadingIndex={uploadingIndex}
        uploadedCount={uploadedCount}
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

      <BottomNav active="upload" />
    </div>
  );
}
