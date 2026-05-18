"use client";

type TipsCardProps = {
  text: string;
  className?: string;
};

export function TipsCard({ text, className = "" }: TipsCardProps) {
  return (
    <div
      className={`w-full rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white px-4 py-3.5 shadow-sm ${className}`.trim()}
    >
      <p className="text-center">
        <span className="inline-flex items-center rounded-full bg-sky-600 px-2.5 py-0.5 text-label-sm font-label-sm font-bold tracking-wide text-white">
          Tips
        </span>
      </p>
      <p className="mt-2.5 text-center text-body-lg font-body-lg font-semibold leading-relaxed text-zinc-900">
        {text}
      </p>
    </div>
  );
}
