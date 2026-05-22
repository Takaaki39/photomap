import type { SpotMapItem } from "@/lib/spotsBoundsCache";

/** 地図ピンの表示期間プリセット */
export type PeriodKey = "week" | "month" | "3m" | "6m" | "year" | "all";

export const PERIOD_OPTIONS: ReadonlyArray<{ value: PeriodKey; label: string }> = [
  { value: "week", label: "今週" },
  { value: "month", label: "今月" },
  { value: "3m", label: "3ヶ月" },
  { value: "6m", label: "半年" },
  { value: "year", label: "1年以内" },
  { value: "all", label: "全部" },
];

export const DEFAULT_PERIOD: PeriodKey = "all";

/** localStorage キー（地図ピンの表示期間） */
export const PERIOD_STORAGE_KEY = "home:pinPeriod";

const VALID_PERIOD_SET = new Set<PeriodKey>(PERIOD_OPTIONS.map((o) => o.value));

export function isPeriodKey(value: unknown): value is PeriodKey {
  return typeof value === "string" && VALID_PERIOD_SET.has(value as PeriodKey);
}

/** localStorage から保存済み期間を読む（無効値・未設定なら null） */
export function readStoredPeriod(): PeriodKey | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PERIOD_STORAGE_KEY);
    return isPeriodKey(raw) ? raw : null;
  } catch {
    return null;
  }
}

/** localStorage に期間を保存する */
export function writeStoredPeriod(period: PeriodKey): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PERIOD_STORAGE_KEY, period);
  } catch {
    // ignore (quota/privacy mode)
  }
}

/**
 * 指定期間の開始日時を返す（その時刻以降の写真が「期間内」）。
 * - week / month はカレンダー基準（週は月曜始まり、月はその月の 1 日 00:00）
 * - 3m / 6m / year は「今から N 日前」のローリング（90 / 180 / 365 日）
 * - all は null
 */
export function getPeriodSince(period: PeriodKey, now: Date = new Date()): Date | null {
  if (period === "all") return null;

  switch (period) {
    case "week": {
      const d = new Date(now);
      const day = d.getDay(); // 0=Sun ... 6=Sat
      const offsetFromMonday = day === 0 ? 6 : day - 1;
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - offsetFromMonday);
      return d;
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    case "3m": {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      return d;
    }
    case "6m": {
      const d = new Date(now);
      d.setDate(d.getDate() - 180);
      return d;
    }
    case "year": {
      const d = new Date(now);
      d.setDate(d.getDate() - 365);
      return d;
    }
    default:
      return null;
  }
}

/** 各スポットの latest_photo_at が指定期間内にあるものだけ残す */
export function filterSpotsByPeriod(
  spots: SpotMapItem[],
  period: PeriodKey,
  now: Date = new Date(),
): SpotMapItem[] {
  const since = getPeriodSince(period, now);
  if (!since) return spots;
  const sinceMs = since.getTime();
  return spots.filter((s) => {
    if (!s.latest_photo_at) return false;
    const t = new Date(s.latest_photo_at).getTime();
    return Number.isFinite(t) && t >= sinceMs;
  });
}
