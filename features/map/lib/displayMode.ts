import type { DisplayMode } from "../types";

export function getDisplayModeByZoom(zoom: number): DisplayMode {
  if (zoom <= 3) return "world";
  if (zoom <= 6) return "country";
  if (zoom <= 9) return "region";
  if (zoom <= 12) return "prefecture";
  if (zoom <= 15) return "city";
  if (zoom >= 16) return "detail";
  return "spot";
}

export const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  world: "世界",
  country: "国",
  region: "地方",
  prefecture: "県",
  city: "市",
  spot: "個別スポット",
  detail: "スポット詳細",
};
