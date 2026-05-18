/**
 * マップ用スポット一覧の共有スナップショット（モジュールスコープ）。
 * API 取得はアップロード・削除後および初回地図表示時のみ。
 * パン・ズームではスナップショットを表示範囲でフィルタするだけ。
 *
 * 注意: DB の get_spots_in_bounds は最大 500 件。それ以上は地図に出ない。
 */

export type SpotMapItem = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  photo_count: number;
  thumbnail_url: string | null;
};

const WORLD_BOUNDS = {
  south: -85,
  west: -180,
  north: 85,
  east: 180,
} as const;

let allSpotsSnapshot: SpotMapItem[] | null = null;

export function hasAllSpotsSnapshot(): boolean {
  return allSpotsSnapshot !== null;
}

export function getAllSpotsSnapshot(): SpotMapItem[] | null {
  return allSpotsSnapshot;
}

export function clearSpotsBoundsCache(): void {
  allSpotsSnapshot = null;
}

export function filterSpotsInBounds(
  spots: SpotMapItem[],
  south: number,
  west: number,
  north: number,
  east: number,
): SpotMapItem[] {
  return spots.filter(
    (s) => s.lat >= south && s.lat <= north && s.lng >= west && s.lng <= east,
  );
}

/** 全スポット（最大 500 件）を API 取得してスナップショットを更新 */
export async function refreshAllSpotsSnapshot(): Promise<boolean> {
  const { south, west, north, east } = WORLD_BOUNDS;
  const params = new URLSearchParams({
    bounds: `${south},${west},${north},${east}`,
    zoom: "5",
  });

  const res = await fetch(`/api/spots?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return false;

  const payload = (await res.json()) as { spots?: SpotMapItem[] };
  allSpotsSnapshot = payload.spots ?? [];
  return true;
}

/** @deprecated アップロード後は全件スナップショットを更新する */
export async function refreshSpotsBoundsCacheAt(
  _lat: number,
  _lng: number,
  _zoom = 16,
): Promise<boolean> {
  return refreshAllSpotsSnapshot();
}
