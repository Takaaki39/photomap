import type { FavoriteSpot, MeProfile, MyPhoto } from "../types";

function spotRegionLabel(name: string, fallback?: string | null) {
  const parts = name.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 1];
  return fallback?.trim() || name;
}

export function countPlacesVisited(photos: MyPhoto[]): number {
  const s = new Set<string>();
  for (const p of photos) {
    if (p.spot_id) s.add(p.spot_id);
    else if (p.spot_name) s.add(p.spot_name);
  }
  return s.size;
}

export function sortPhotosNewestFirst(photos: MyPhoto[]): MyPhoto[] {
  return [...photos].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function buildFavoriteSpots(
  photos: MyPhoto[],
  profile: MeProfile | null,
): FavoriteSpot[] {
  const byKey = new Map<string, MyPhoto[]>();
  for (const p of photos) {
    const key = p.spot_id || p.spot_name || "unknown";
    const list = byKey.get(key) ?? [];
    list.push(p);
    byKey.set(key, list);
  }
  return [...byKey.entries()]
    .map(([spotKey, spotPhotos]) => {
      const sorted = sortPhotosNewestFirst(spotPhotos);
      const name = sorted[0]?.spot_name || "名称未設定";
      return {
        spotKey,
        name,
        region: spotRegionLabel(name, profile?.primary_location),
        photos: sorted,
        coverUrl: sorted.find((x) => x.image_url)?.image_url ?? null,
      };
    })
    .sort((a, b) => b.photos.length - a.photos.length);
}

export function spotDescription(name: string) {
  return `${name}周辺で撮影した写真と思い出。`;
}
