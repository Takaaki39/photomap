"use client";

export function HomeBottomRightControls({
  onLocate,
}: {
  onLocate: () => void;
}) {
  return (
    <div className="absolute bottom-32 right-4 z-20 md:right-8">
      <button
        type="button"
        aria-label="現在地へ移動"
        onClick={onLocate}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-sky-200/60 bg-[#0b1220]/82 text-white shadow-[0_10px_30px_rgba(2,132,199,0.45)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(14,165,233,0.55)] active:scale-95"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-sky-300/20 via-transparent to-cyan-300/25"
        />
        <img
          src="/icons/my_location_48dp_E3E3E3_FILL0_wght400_GRAD0_opsz48.svg"
          alt=""
          width={30}
          height={30}
          className="pointer-events-none block brightness-[1.25] contrast-125"
          aria-hidden
        />
      </button>
    </div>
  );
}

