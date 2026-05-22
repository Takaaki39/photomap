import type { SpotMapItem } from "@/lib/spotsBoundsCache";

/**
 * 写真に付ける手動タグ。値そのものは任意の文字列。
 * - ビルトイン: park / food / landscape（slug が DB に入る）
 * - カスタム: ユーザーが入力した日本語等の文字列がそのまま DB に入る
 */
export type PhotoTag = string;

/** ツールバーのタグフィルタ値（"all" = 絞り込みなし） */
export type PhotoTagFilter = string;

/** ビルトイン（全ユーザー共通）のタグ */
export const BUILTIN_PHOTO_TAGS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "park", label: "公園" },
  { value: "food", label: "食事" },
  { value: "landscape", label: "風景" },
];

/** 後方互換のため旧名を export */
export const PHOTO_TAGS = BUILTIN_PHOTO_TAGS;

const BUILTIN_VALUES = new Set(BUILTIN_PHOTO_TAGS.map((t) => t.value));
const BUILTIN_LABELS = new Set(BUILTIN_PHOTO_TAGS.map((t) => t.label));

export const DEFAULT_TAG_FILTER: PhotoTagFilter = "all";

/** ツールバーのタグ選択を保存する localStorage キー */
export const TAG_FILTER_STORAGE_KEY = "home:pinTagFilter";

/** タグ文字列の最大長（トリム後） */
export const MAX_CUSTOM_TAG_LENGTH = 16;

/**
 * 任意のタグ値（文字列）に対する弱いバリデーション。
 * アップロード API のサーバー受け取り側で利用。
 */
export function isValidTagValue(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > MAX_CUSTOM_TAG_LENGTH) return false;
  return true;
}

/** 後方互換: 旧名 (true if "any acceptable tag string") */
export const isPhotoTag = isValidTagValue;

/** フィルタ値（"all" or 任意の非空文字列）として妥当か */
export function isPhotoTagFilter(value: unknown): value is PhotoTagFilter {
  if (value === "all") return true;
  return isValidTagValue(value);
}

/** ユーザー入力をタグ文字列として正規化（trim のみ。null/不正は null） */
export function normalizeCustomTag(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  if (t.length > MAX_CUSTOM_TAG_LENGTH) return null;
  return t;
}

export type ValidateAddTagResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

/**
 * カスタムタグ追加時のクライアント側バリデーション。
 * - 空文字 / 長さ超過 / ビルトインの slug or label / 既存ユーザー値との重複 を弾く
 */
export function validateAddCustomTag(
  raw: string,
  existingCustom: string[],
): ValidateAddTagResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "タグ名を入力してください。" };
  if (trimmed.length > MAX_CUSTOM_TAG_LENGTH) {
    return { ok: false, error: `${MAX_CUSTOM_TAG_LENGTH} 文字以内で入力してください。` };
  }
  if (BUILTIN_VALUES.has(trimmed) || BUILTIN_LABELS.has(trimmed)) {
    return { ok: false, error: "デフォルトのタグと同名は登録できません。" };
  }
  if (existingCustom.includes(trimmed)) {
    return { ok: false, error: "同じ名前のタグが既に存在します。" };
  }
  return { ok: true, value: trimmed };
}

/** タグ値からツールバー/ピッカーで表示するラベルを得る（ビルトインは日本語化） */
export function labelForTag(tag: string): string {
  const builtin = BUILTIN_PHOTO_TAGS.find((t) => t.value === tag);
  return builtin?.label ?? tag;
}

/** localStorage から保存済みタグフィルタを読む */
export function readStoredTagFilter(): PhotoTagFilter | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TAG_FILTER_STORAGE_KEY);
    return isPhotoTagFilter(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredTagFilter(filter: PhotoTagFilter): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TAG_FILTER_STORAGE_KEY, filter);
  } catch {
    // ignore (quota/privacy mode)
  }
}

/**
 * フィルタ対象のタグを持つスポットだけを残す。
 * filter === "all" の場合は無加工で返す。
 */
export function filterSpotsByTag(
  spots: SpotMapItem[],
  filter: PhotoTagFilter,
): SpotMapItem[] {
  if (filter === "all") return spots;
  return spots.filter((s) => Array.isArray(s.tags) && s.tags.includes(filter));
}

/** ビルトイン + ユーザーのカスタムタグを 1 つの選択肢配列に統合（UI 用） */
export function mergeTagOptions(
  customTags: ReadonlyArray<{ id: string; tag: string }>,
): Array<{ value: string; label: string; custom: boolean; id: string | null }> {
  const result: Array<{ value: string; label: string; custom: boolean; id: string | null }> =
    BUILTIN_PHOTO_TAGS.map((t) => ({ value: t.value, label: t.label, custom: false, id: null }));
  for (const c of customTags) {
    if (!c.tag) continue;
    if (result.some((r) => r.value === c.tag)) continue;
    result.push({ value: c.tag, label: c.tag, custom: true, id: c.id });
  }
  return result;
}
