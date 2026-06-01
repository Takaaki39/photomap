"use client";

import { useRouter } from "next/navigation";
import { UploadResultModal } from "@/components/Upload/UploadResultModal";
import { UploadFileDrop } from "@/components/Upload/UploadFileDrop";
import { UploadLocationCard } from "@/components/Upload/UploadLocationCard";
import { UploadPreview } from "@/components/Upload/UploadPreview";
import { UploadTagPicker } from "@/components/Upload/UploadTagPicker";
import { BottomNav } from "@/components/Nav/BottomNav";
import { APP_MAIN_BOTTOM_CLASS, APP_MAIN_TOP_CLASS, TopNav } from "@/components/Nav/TopNav";
import { useUploadFlow } from "@/features/upload/hooks/useUploadFlow";

export default function UploadPage() {
  const router = useRouter();
  const {
    stage,
    step,
    files,
    activeIndex,
    setActiveIndex,
    previewUrl,
    activeFile,
    activeGps,
    tag,
    setTag,
    error,
    result,
    uploadingIndex,
    uploadedCount,
    canProceed,
    onPickFiles,
    onSubmit,
    formatBytes,
  } = useUploadFlow();

  const stepItems = [
    { id: 1, label: "選択" },
    { id: 2, label: "確認" },
    { id: 3, label: "投稿" },
  ] as const;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#eef4ff_42%,#e9edf6_100%)] text-[#0f172a] scheme-light">
      <TopNav />

      <main
        className={`mx-auto w-full max-w-7xl px-4 md:px-margin-desktop ${APP_MAIN_TOP_CLASS} ${APP_MAIN_BOTTOM_CLASS} pb-32 pt-4 md:pt-6`}
      >
        <header className="mb-6 rounded-3xl border border-slate-200/75 bg-white/82 px-5 py-4 shadow-[0_14px_36px_rgba(15,23,42,0.1)] backdrop-blur-sm md:px-6 md:py-5">
          <p className="text-label-sm font-label-sm uppercase tracking-wider text-sky-700">Upload</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#0f172a] md:text-3xl">写真をアップロード</h1>
          <p className="mt-1 text-sm text-[#475569] md:text-base">
            位置情報付きの写真を選ぶだけで、スポットに自動で整理して追加できます。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {stepItems.map((item) => {
              const active = step >= item.id;
              return (
                <span
                  key={item.id}
                  className={
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide " +
                    (active
                      ? "border-sky-500/35 bg-sky-500/12 text-sky-700"
                      : "border-slate-200 bg-white text-slate-500")
                  }
                >
                  {item.id}. {item.label}
                </span>
              );
            })}
          </div>
        </header>

        {error ? (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            <span aria-hidden className="mt-0.5 text-rose-500">
              ⚠
            </span>
            <span>{error}</span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-start">
          <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-4 lg:col-span-7 xl:col-span-8">
            <input
              id="upload-file-input"
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
                <UploadFileDrop
                  onDrop={async (e) => {
                    e.preventDefault();
                    const list = Array.from(e.dataTransfer.files ?? []);
                    if (list.length > 0) await onPickFiles(list);
                  }}
                  onPickClick={() => document.getElementById("upload-file-input")?.click()}
                />
              </div>
            ) : (
              <UploadPreview
                previewUrl={previewUrl}
                pickable={stage === "review"}
                onRequestPick={() => document.getElementById("upload-file-input")?.click()}
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

          <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-29">
            <div className="flex flex-col gap-4">
              <UploadLocationCard gps={activeGps} />

              {stage === "review" ? (
                <UploadTagPicker value={tag} onChange={setTag} />
              ) : null}

              {stage === "review" && files.length > 1 ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 text-body-md font-body-md shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[#475569]">
                      選択中: {activeIndex + 1}/{files.length}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-label-lg font-label-lg text-slate-700 transition-colors hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60"
                        onClick={() => setActiveIndex((v) => Math.max(0, v - 1))}
                        disabled={activeIndex === 0}
                      >
                        前
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-label-lg font-label-lg text-slate-700 transition-colors hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60"
                        onClick={() => setActiveIndex((v) => Math.min(files.length - 1, v + 1))}
                        disabled={activeIndex >= files.length - 1}
                      >
                        次
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-sky-200/70 bg-linear-to-br from-sky-50 to-indigo-50 p-3 shadow-[0_12px_28px_rgba(14,116,144,0.12)]">
                <p className="mb-2 px-1 text-label-sm font-label-sm font-semibold uppercase tracking-wide text-sky-700">
                  投稿する
                </p>
                <button
                  type="button"
                  aria-busy={stage === "uploading" || undefined}
                  disabled={stage === "select" || files.length === 0 || !canProceed}
                  onClick={() => void onSubmit()}
                  className="group relative flex w-full items-center gap-4 overflow-hidden rounded-xl px-4 py-4 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white aria-busy:pointer-events-none aria-busy:cursor-wait disabled:cursor-not-allowed disabled:border-2 disabled:border-dashed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:shadow-none enabled:cursor-pointer enabled:border-2 enabled:border-sky-200/45 enabled:bg-linear-to-r enabled:from-sky-500 enabled:to-blue-600 enabled:text-white enabled:shadow-[0_16px_40px_-10px_rgba(14,165,233,0.55)] enabled:hover:-translate-y-0.5 enabled:hover:border-sky-200/65 enabled:hover:from-sky-400 enabled:hover:to-blue-500 enabled:hover:shadow-[0_20px_56px_-10px_rgba(14,165,233,0.6)] enabled:active:translate-y-0 enabled:active:shadow-[0_10px_30px_-10px_rgba(14,165,233,0.45)]"
                >
                  <span
                    aria-hidden
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/18 text-white transition-colors group-hover:bg-white/28 group-disabled:bg-slate-200 group-disabled:text-slate-500"
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

              <p className="rounded-xl border border-slate-200/80 bg-white/88 px-4 py-3 text-center text-label-sm font-label-sm text-[#64748b]">
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
