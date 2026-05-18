import uploadTips from "@/data/tips.json";

type TipsFile = { tips?: string[] };

export const TIP_LIST: string[] = ((uploadTips as TipsFile).tips ?? []).filter(
  (t) => typeof t === "string" && t.trim().length > 0,
);

export const TIP_FALLBACK = "しばらくお待ちください。";

export function pickRandomTip(): string {
  if (TIP_LIST.length === 0) return TIP_FALLBACK;
  return TIP_LIST[Math.floor(Math.random() * TIP_LIST.length)]!;
}
