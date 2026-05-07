"use client";

export function MeFilters({
  q,
  setQ,
  from,
  setFrom,
  to,
  setTo,
  visibility,
  setVisibility,
}: {
  q: string;
  setQ: (v: string) => void;
  from: string;
  setFrom: (v: string) => void;
  to: string;
  setTo: (v: string) => void;
  visibility: "all" | "public" | "private";
  setVisibility: (v: "all" | "public" | "private") => void;
}) {
  return (
    <section className="mt-4 grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-4">
      <input
        placeholder="キーワード検索"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="rounded border px-3 py-2 text-sm"
      />
      <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border px-3 py-2 text-sm" />
      <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border px-3 py-2 text-sm" />
      <select
        value={visibility}
        onChange={(e) => setVisibility(e.target.value as "all" | "public" | "private")}
        className="rounded border px-3 py-2 text-sm"
      >
        <option value="all">公開状態: すべて</option>
        <option value="public">公開のみ</option>
        <option value="private">非公開のみ</option>
      </select>
    </section>
  );
}

