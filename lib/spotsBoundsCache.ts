/**
 * マップ用スポット一覧の bounds キャッシュ（モジュールスコープ）。
 * ルート遷移で MapView がアンマウントされても残るため、ギャラリーから戻った直後もヒットしやすい。
 * アップロード・写真削除成功時は clearSpotsBoundsCache() で無効化し、次回ビューで API から取り直す。
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

const BOUNDS_CACHE_EPS = 1e-5;
export const MAX_SPOTS_BOUNDS_CACHE_ENTRIES = 24;

export type SpotsBoundsCacheEntry = {
  fetchKey: string;
  south: number;
  west: number;
  north: number;
  east: number;
  spots: SpotMapItem[];
};

/** 共有キャッシュ（同一タブ内のナビゲーションで保持） */
export const spotsBoundsCache: SpotsBoundsCacheEntry[] = [];

export function clearSpotsBoundsCache(): void {
  spotsBoundsCache.length = 0;
}

function boundsRectContainsRect(
  outer: { south: number; west: number; north: number; east: number },
  innerSouth: number,
  innerWest: number,
  innerNorth: number,
  innerEast: number,
): boolean {
  return (
    innerSouth >= outer.south - BOUNDS_CACHE_EPS &&
    innerNorth <= outer.north + BOUNDS_CACHE_EPS &&
    innerWest >= outer.west - BOUNDS_CACHE_EPS &&
    innerEast <= outer.east + BOUNDS_CACHE_EPS
  );
}

function filterSpotsByBounds(
  spots: SpotMapItem[],
  innerSouth: number,
  innerWest: number,
  innerNorth: number,
  innerEast: number,
): SpotMapItem[] {
  return spots.filter(
    (s) => s.lat >= innerSouth && s.lat <= innerNorth && s.lng >= innerWest && s.lng <= innerEast,
  );
}

/** ヒット時は LRU 用に `cache` の先頭へ該当エントリを移動する */
export function readSpotsFromBoundsCache(
  cache: SpotsBoundsCacheEntry[],
  fetchKey: string,
  innerSouth: number,
  innerWest: number,
  innerNorth: number,
  innerEast: number,
  debug: boolean,
): SpotMapItem[] | null {
  const exactIdx = cache.findIndex((e) => e.fetchKey === fetchKey);
  if (exactIdx >= 0) {
    const entry = cache[exactIdx];
    if (exactIdx > 0) {
      cache.splice(exactIdx, 1);
      cache.unshift(entry);
    }
    if (debug) console.log("[spots] bounds cache hit exact (global)", fetchKey);
    return entry.spots;
  }
  for (let i = 0; i < cache.length; i++) {
    const e = cache[i];
    if (!boundsRectContainsRect(e, innerSouth, innerWest, innerNorth, innerEast)) continue;
    if (i > 0) {
      cache.splice(i, 1);
      cache.unshift(e);
    }
    if (debug) console.log("[spots] bounds cache hit subset (global)", e.fetchKey, "->", fetchKey);
    return filterSpotsByBounds(e.spots, innerSouth, innerWest, innerNorth, innerEast);
  }
  return null;
}

export function writeSpotsBoundsCache(cache: SpotsBoundsCacheEntry[], entry: SpotsBoundsCacheEntry): void {
  const dup = cache.findIndex((e) => e.fetchKey === entry.fetchKey);
  if (dup >= 0) cache.splice(dup, 1);
  cache.unshift(entry);
  if (cache.length > MAX_SPOTS_BOUNDS_CACHE_ENTRIES) {
    cache.length = MAX_SPOTS_BOUNDS_CACHE_ENTRIES;
  }
}
