"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AccountCircleNavIcon } from "@/shared/ui/Nav/AccountCircleNavIcon";
import { mergeTagOptions, type PhotoTagFilter } from "@/lib/photoTag";
import { PERIOD_OPTIONS, type PeriodKey } from "@/lib/spotPeriod";

/** 固定ヘッダーぶんの main 上余白 */
export const APP_MAIN_TOP_CLASS = "app-main-top";

/** 固定フッターナビぶんの main 下余白 */
export const APP_MAIN_BOTTOM_CLASS = "app-main-bottom";

export type TopNavFilterProps = {
  period: PeriodKey;
  onPeriodChange: (next: PeriodKey) => void;
  tagFilter: PhotoTagFilter;
  onTagFilterChange: (next: PhotoTagFilter) => void;
  customTags: ReadonlyArray<{ id: string; tag: string }>;
};

type TopNavProps = {
  filters?: TopNavFilterProps;
};

/** PhotoMap 共通ヘッダー: ロゴ + （任意）期間・タグ + プロフィール */
export function TopNav({ filters }: TopNavProps = {}) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const tagOptions = useMemo(() => {
    if (!filters) return [];
    const merged = mergeTagOptions(filters.customTags);
    const list = [{ value: "all", label: "全部" }, ...merged.map((t) => ({ value: t.value, label: t.label }))];
    if (filters.tagFilter !== "all" && !list.some((o) => o.value === filters.tagFilter)) {
      list.push({ value: filters.tagFilter, label: `${filters.tagFilter}（削除済み）` });
    }
    return list;
  }, [filters]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!headerRef.current?.contains(target)) setMobileFiltersOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileFiltersOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileFiltersOpen]);

  return (
    <header
      ref={headerRef}
      className={`app-header${filters ? " app-header--with-filters" : " app-header--simple"}${mobileFiltersOpen ? " app-header--filters-open" : ""}`}
    >
      <div className="app-header__brand-left">
        {filters ? (
          <button
            type="button"
            className="app-header__filters-toggle"
            aria-label="期間とタグのフィルターを開く"
            aria-expanded={mobileFiltersOpen}
            aria-controls="header-filters-panel"
            onClick={() => setMobileFiltersOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        ) : null}
        <Link href="/" className="app-header__logo">
          PhotoMap
        </Link>
      </div>

      {filters ? (
        <div className="app-header__filters" id="header-filters-panel">
          <HeaderFilterSelect
            label="期間"
            ariaLabel="ピンの表示期間"
            value={filters.period}
            onChange={(v) => filters.onPeriodChange(v as PeriodKey)}
            options={PERIOD_OPTIONS}
          />
          <HeaderFilterSelect
            label="タグ"
            ariaLabel="ピンの表示タグ"
            value={filters.tagFilter}
            onChange={(v) => filters.onTagFilterChange(v)}
            options={tagOptions}
          />
        </div>
      ) : null}

      <div className="app-header__actions">
        <Link href="/profile" className="app-header__profile-link" aria-label="プロフィール">
          <AccountCircleNavIcon />
        </Link>
      </div>
    </header>
  );
}

function HeaderFilterSelect({
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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLLabelElement | null>(null);
  const reactId = useId();
  const listboxId = `header-filter-${label}-${reactId.replace(/[:]/g, "")}`;
  const selectedLabel = options.find((opt) => opt.value === value)?.label ?? "選択";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!rootRef.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <label className="app-header__filter" ref={rootRef}>
      <span className="app-header__filter-label">{label}</span>
      <div className={`app-header__filter-select-wrap${open ? " is-open" : ""}`}>
        <button
          type="button"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          className="app-header__filter-select"
          onClick={() => setOpen((v) => !v)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpen(true);
            }
          }}
        >
          <span className="app-header__filter-value">{selectedLabel}</span>
        </button>
        <span className="app-header__filter-chevron" aria-hidden>
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
        {open ? (
          <div id={listboxId} role="listbox" className="app-header__filter-menu" aria-label={ariaLabel}>
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`app-header__filter-option${active ? " app-header__filter-option--active" : ""}`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </label>
  );
}
