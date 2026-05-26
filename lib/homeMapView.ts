export type HomeMapView = {
  lat: number;
  lng: number;
  zoom: number;
  t?: number;
};

const STORAGE_KEY = "home:lastView";
/** この値未満のズームは誤保存（アンマウント時の moveend 等）とみなし永続化しない */
export const MIN_HOME_MAP_ZOOM = 6;

export function readHomeMapView(): HomeMapView | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as { lat?: unknown; lng?: unknown; zoom?: unknown };
    const lat = typeof d.lat === "number" ? d.lat : null;
    const lng = typeof d.lng === "number" ? d.lng : null;
    const zoom = typeof d.zoom === "number" ? d.zoom : null;
    if (lat == null || lng == null || zoom == null) return null;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(zoom)) return null;
    if (zoom < MIN_HOME_MAP_ZOOM) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { lat, lng, zoom: Math.min(18, zoom) };
  } catch {
    return null;
  }
}

export function writeHomeMapView(view: HomeMapView): void {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(view.lat) || !Number.isFinite(view.lng) || !Number.isFinite(view.zoom)) return;
  if (view.zoom < MIN_HOME_MAP_ZOOM) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...view, t: Date.now() }),
    );
  } catch {
    // ignore
  }
}

export function isPersistableHomeMapView(view: { lat: number; lng: number; zoom: number }): boolean {
  return (
    Number.isFinite(view.lat) &&
    Number.isFinite(view.lng) &&
    Number.isFinite(view.zoom) &&
    view.zoom >= MIN_HOME_MAP_ZOOM
  );
}
