"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAX_CUSTOM_TAG_LENGTH,
  mergeTagOptions,
  validateAddCustomTag,
} from "@/lib/photoTag";

type CustomTag = { id: string; tag: string };

/**
 * アップロード画面のタグ選択。
 * - ビルトイン (公園 / 食事 / 風景) + ユーザーのカスタムタグから単一選択
 * - インラインの入力欄からその場で新しいタグを追加できる
 * - カスタムタグは × ボタンで削除可能（既存写真の値は残るが UI からは消える）
 */
export function UploadTagPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const [customTags, setCustomTags] = useState<CustomTag[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/me/tags", { cache: "no-store" });
        if (!res.ok) return;
        const d = (await res.json()) as { tags?: CustomTag[] };
        if (!cancelled) setCustomTags(d.tags ?? []);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const options = mergeTagOptions(customTags);

  const handleAdd = async () => {
    const existing = customTags.map((c) => c.tag);
    const validation = validateAddCustomTag(input, existing);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/me/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: validation.value }),
      });
      const payload = (await res.json().catch(() => ({}))) as { tag?: CustomTag; error?: string };
      if (!res.ok || !payload.tag) {
        setError(payload.error ?? "タグの追加に失敗しました。");
        return;
      }
      setCustomTags((prev) => [...prev, payload.tag as CustomTag]);
      onChange(validation.value);
      setInput("");
      setAdding(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (target: CustomTag) => {
    if (!confirm(`タグ「${target.tag}」を削除します。\nこのタグを付けた写真自体は残ります。`)) return;
    const res = await fetch(`/api/me/tags/${target.id}`, { method: "DELETE" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      setError(text || "タグの削除に失敗しました。");
      return;
    }
    setCustomTags((prev) => prev.filter((c) => c.id !== target.id));
    if (value === target.tag) onChange(null);
  };

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-base shadow-md">
      <div className="px-2 py-1">
        <div className="text-label-sm font-label-sm text-primary uppercase">タグ（任意）</div>

        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((opt) => {
            const selected = value === opt.value;
            return (
              <span key={opt.value} className="relative inline-flex items-center">
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange(selected ? null : opt.value)}
                  className={
                    "rounded-full border px-3 py-1 text-label-md font-label-md transition-colors " +
                    (opt.custom ? "pr-7 " : "") +
                    (selected
                      ? "border-[#2563eb] bg-[#2563eb] text-white shadow-sm"
                      : "border-[#d1d5db] bg-white text-[#374151] hover:bg-[#f3f4f6]")
                  }
                >
                  {opt.label}
                </button>
                {opt.custom && opt.id ? (
                  <button
                    type="button"
                    aria-label={`タグ「${opt.label}」を削除`}
                    title="このタグを削除"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete({ id: opt.id as string, tag: opt.value });
                    }}
                    className={
                      "absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] leading-none transition-colors " +
                      (selected
                        ? "bg-white/20 text-white hover:bg-white/35"
                        : "bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]")
                    }
                  >
                    ×
                  </button>
                ) : null}
              </span>
            );
          })}

          {adding ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#d1d5db] bg-white px-2 py-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                maxLength={MAX_CUSTOM_TAG_LENGTH}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleAdd();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setAdding(false);
                    setInput("");
                    setError(null);
                  }
                }}
                placeholder="新しいタグ"
                className="w-28 border-none bg-transparent px-1 py-0 text-label-md font-label-md text-[#111827] focus:outline-none"
                aria-label="新しいタグ名"
              />
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleAdd()}
                className="rounded-full bg-[#2563eb] px-2 py-0.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                追加
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setInput("");
                  setError(null);
                }}
                className="rounded-full px-1 text-xs text-[#6b7280] hover:text-[#111827]"
                aria-label="キャンセル"
              >
                ×
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="rounded-full border border-dashed border-[#9ca3af] bg-transparent px-3 py-1 text-label-md font-label-md text-[#374151] hover:bg-[#f3f4f6]"
            >
              ＋ タグを追加
            </button>
          )}
        </div>

        {error ? (
          <p className="mt-2 px-1 text-label-sm font-label-sm text-[#dc2626]" role="alert">
            {error}
          </p>
        ) : (
          <p className="mt-2 px-1 text-label-sm font-label-sm text-outline">
            {value
              ? "再度タップで解除できます"
              : loaded
                ? "未選択（タグ無しで投稿）"
                : "読み込み中…"}
          </p>
        )}
      </div>
    </div>
  );
}
