/**
 * ギャラリー動的ルート `[id]` 用。ブラウザ・Next の経路で 1 段以上 encode されたまま届く場合があるため、
 * 復号してから `cluster:spots~` などの判定を行う。
 */
export function normalizeGalleryRouteId(raw: string): string {
  let s = raw;
  for (let i = 0; i < 4; i++) {
    try {
      const next = decodeURIComponent(s);
      if (next === s) break;
      s = next;
    } catch {
      break;
    }
  }
  return s;
}

export function isMergedSpotsClusterGalleryId(id: string): boolean {
  return normalizeGalleryRouteId(id).startsWith("cluster:spots~");
}
