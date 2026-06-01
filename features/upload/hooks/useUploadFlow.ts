import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { extractGpsFromExif } from "@/lib/exif";
import { refreshAllSpotsSnapshot } from "@/lib/spotsBoundsCache";
import { uploadPhotoViaStorage } from "@/features/upload/api/uploadPhotoApi";
import { reverseGeocode } from "@/features/geocode/api/reverseGeocodeApi";

export type UploadStage = "select" | "review" | "uploading" | "done";

export type UploadResult = {
  spot_id: string;
  photo_id: string;
  lat?: number;
  lng?: number;
};

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
]);
const REVERSE_GEOCODE_MIN_INTERVAL_MS = 1100;

function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)}MB`;
}

function validateFile(f: File): string | null {
  if (!ALLOWED_MIME.has(f.type)) {
    return "対応形式は JPEG / PNG / HEIC / WebP です。";
  }
  if (f.size > MAX_BYTES) {
    return `ファイルサイズが大きすぎます（最大20MB）。現在: ${formatBytes(f.size)}`;
  }
  return null;
}

export function useUploadFlow() {
  const [stage, setStage] = useState<UploadStage>("select");
  const [files, setFiles] = useState<File[]>([]);
  const [gpsList, setGpsList] = useState<Array<{ lat: number; lng: number }>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPublic] = useState(true);
  const [placeName, setPlaceName] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);
  const lastAutoFillKeyRef = useRef<string>("");

  const canProceed = useMemo(
    () => files.length > 0 && gpsList.length === files.length,
    [files.length, gpsList.length],
  );

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

  const resetAll = useCallback(() => {
    setFiles([]);
    setGpsList([]);
    setActiveIndex(0);
    setStage("select");
    setResult(null);
    setUploadingIndex(null);
    setUploadedCount(0);
    setTag(null);
  }, []);

  const onPickFiles = useCallback(
    async (picked: File[]) => {
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

      if (withoutExif.length > 0) {
        setError(
          `位置情報（EXIF）が無いので除外しました: ${withoutExif.slice(0, 5).join("、")}${withoutExif.length > 5 ? ` ほか${withoutExif.length - 5}件` : ""}`,
        );
      }
    },
    [files.length, resetAll, stage],
  );

  useEffect(() => {
    const chosen = activeGps;
    if (!chosen) return;

    const key = `${chosen.lat.toFixed(6)},${chosen.lng.toFixed(6)}`;
    if (key === lastAutoFillKeyRef.current) return;

    const canOverwrite =
      placeName.trim().length === 0 || placeName === lastAutoFillKeyRef.current;
    if (!canOverwrite) {
      lastAutoFillKeyRef.current = key;
      return;
    }

    lastAutoFillKeyRef.current = key;
    void (async () => {
      try {
        const geo = await reverseGeocode(chosen.lat, chosen.lng);
        if (!geo?.name) return;
        setPlaceName((prev) => (prev.trim().length === 0 ? geo.name : prev));
      } catch {
        // ignore
      }
    })();
  }, [activeGps, placeName]);

  const onSubmit = useCallback(async () => {
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
          lat: photoGps.lat,
          lng: photoGps.lng,
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
  }, [canProceed, files, gpsList, isPublic, placeName, stage, tag]);

  const step = stage === "select" ? 1 : stage === "review" ? 2 : 3;

  return {
    stage,
    step,
    files,
    activeIndex,
    setActiveIndex,
    activeFile,
    activeGps,
    previewUrl,
    placeName,
    setPlaceName,
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
  };
}
