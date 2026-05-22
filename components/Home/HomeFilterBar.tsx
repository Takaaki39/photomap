"use client";

import { useMemo } from "react";
import { mergeTagOptions, type PhotoTagFilter } from "@/lib/photoTag";
import { PERIOD_OPTIONS, type PeriodKey } from "@/lib/spotPeriod";

/**
 * ヘッダー直下の機能バー。
 * 右端に: 期間プルダウン / タグプルダウン。
 * 左側は将来の機能（検索・並び替え等）用の余白。
 *
 * 高さは 48px。`HomePageClient` 側で `top: 64px (header) + 48px (this) = 112px` を地図の上端にする。
 */
export function HomeFilterBar({
  period,
  onPeriodChange,
  tagFilter,
  onTagFilterChange,
  customTags,
}: {
  period: PeriodKey;
  onPeriodChange: (next: PeriodKey) => void;
  tagFilter: PhotoTagFilter;
  onTagFilterChange: (next: PhotoTagFilter) => void;
  customTags: ReadonlyArray<{ id: string; tag: string }>;
}) {
  const tagOptions = useMemo(() => {
    const merged = mergeTagOptions(customTags);
    const list = [{ value: "all", label: "全部" }, ...merged.map((t) => ({ value: t.value, label: t.label }))];
    // 保存済み値が options に無くなっている場合に備え、暗黙の選択肢として末尾に追加（"(削除済み)" 表記）
    if (tagFilter !== "all" && !list.some((o) => o.value === tagFilter)) {
      list.push({ value: tagFilter, label: `${tagFilter}（削除済み）` });
    }
    return list;
  }, [customTags, tagFilter]);

  return (
    <div className="fixed top-16 left-0 right-0 z-40 h-12 border-b border-[#d1d5db] bg-[#e5e7eb]/95 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.12),0_2px_4px_-2px_rgba(0,0,0,0.08)] backdrop-blur-sm">
      <div className="flex h-full w-full items-center gap-3 overflow-x-auto px-4 sm:px-6 md:px-8">
        {/* Extension slot: 将来の機能（検索・並び替え等）をここに追加する */}
        <div className="flex-1" />

        <FilterSelect
          label="期間"
          ariaLabel="ピンの表示期間"
          value={period}
          onChange={(v) => onPeriodChange(v as PeriodKey)}
          options={PERIOD_OPTIONS}
        />

        <FilterSelect
          label="タグ"
          ariaLabel="ピンの表示タグ"
          value={tagFilter}
          onChange={(v) => onTagFilterChange(v)}
          options={tagOptions}
        />
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  ariaLabel,
  value,
  onChange,
  options,
}: {
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (next: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <label className="flex shrink-0 items-center gap-2">
      <span className="text-xs font-medium text-[#374151]">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel}
          className="h-8 appearance-none rounded-md border border-[#d1d5db] bg-white py-0 pl-3 pr-8 text-sm leading-none text-[#111827] shadow-sm transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7280]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </label>
  );
}

/** 機能バーの高さ（px）。HomePageClient 側のレイアウト計算で参照する */
export const HOME_FILTER_BAR_HEIGHT_PX = 48;
