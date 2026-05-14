"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { Icon, Map as LeafletMap } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import { useRouter, useSearchParams } from "next/navigation";
import { GeoJSON, MapContainer, TileLayer, useMapEvents } from "react-leaflet";

type SpotMapItem = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  photo_count: number;
  thumbnail_url: string | null;
};

type DisplayMode =
  | "world"
  | "country"
  | "region"
  | "prefecture"
  | "city"
  | "spot"
  | "detail";

const INITIAL_CENTER: [number, number] = [35.681236, 139.767125]; // Tokyo (fallback)
const INITIAL_ZOOM = 11;

const PREF_BORDERS_URL = "https://raw.githubusercontent.com/four4to6/47-prefectures/master/data/prefectures.geojson";

function readPersistedHomeView(): { lat: number; lng: number; zoom: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("home:lastView");
    if (!raw) return null;
    const d = JSON.parse(raw) as { lat?: unknown; lng?: unknown; zoom?: unknown };
    const lat = typeof d.lat === "number" ? d.lat : null;
    const lng = typeof d.lng === "number" ? d.lng : null;
    const zoom = typeof d.zoom === "number" ? d.zoom : null;
    if (lat == null || lng == null || zoom == null) return null;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(zoom)) return null;
    return { lat, lng, zoom: Math.max(2, Math.min(18, zoom)) };
  } catch {
    return null;
  }
}

function getDisplayModeByZoom(zoom: number): DisplayMode {
  if (zoom <= 3) return "world";
  if (zoom <= 6) return "country";
  if (zoom <= 9) return "region";
  if (zoom <= 12) return "prefecture";
  if (zoom <= 15) return "city";
  if (zoom >= 16) return "detail";
  return "spot";
}

// 全ピンで同一のアイコンを使い回すことで、画像取得とDOM構築コストを最小化する。
// viewBox 底中央 (60,85) を地理座標のアンカーとする（本体 rect の下端）。
let sharedMarkerIcon: Icon | null = null;
function getMarkerIcon(): Icon {
  if (!sharedMarkerIcon) {
    sharedMarkerIcon = L.icon({
      iconUrl: "/map-pin.svg",
      iconSize: [40, 40],
      iconAnchor: [20, (85 * 40) / 120],
      popupAnchor: [0, (-85 * 40) / 120],
    });
  }
  return sharedMarkerIcon;
}

export type MapViewHandle = {
  setZoom: (zoom: number) => void;
  locate: () => void;
};

function MapEventBridge({
  onBoundsChange,
  onViewChange,
}: {
  onBoundsChange: (map: LeafletMap) => void;
  onViewChange?: (v: { lat: number; lng: number; zoom: number }) => void;
}) {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChange(map);
      if (onViewChange) {
        const c = map.getCenter();
        onViewChange({ lat: c.lat, lng: c.lng, zoom: map.getZoom() });
      }
    },
    zoomend: () => {
      onBoundsChange(map);
      if (onViewChange) {
        const c = map.getCenter();
        onViewChange({ lat: c.lat, lng: c.lng, zoom: map.getZoom() });
      }
    },
  });
  return null;
}

function MapInitializer({ onReady }: { onReady: (map: LeafletMap) => void }) {
  const map = useMapEvents({});
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

function ModeSync({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => onZoom(map.getZoom()),
  });
  useEffect(() => {
    onZoom(map.getZoom());
  }, [map, onZoom]);
  return null;
}

const MapViewClient = forwardRef<
  MapViewHandle,
  {
    query?: string;
    showInternalControls?: boolean;
    requestedZoom?: number;
    locateSignal?: number;
    initialCenter?: { lat: number; lng: number } | null;
    initialZoom?: number;
    recenterSignal?: number;
    onViewChange?: (v: { lat: number; lng: number; zoom: number }) => void;
    mapWrapClassName?: string;
  }
 >(function MapViewClient(
  {
    query,
    showInternalControls = true,
    requestedZoom,
    locateSignal,
    initialCenter,
    initialZoom,
    recenterSignal,
    onViewChange,
    mapWrapClassName,
  },
  ref,
 ) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debugParam = searchParams.get("debug");
  const debug = debugParam === "1" || debugParam === "true" || debugParam === "" || debugParam === "yes";
  const [spots, setSpots] = useState<SpotMapItem[]>([]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(
    getDisplayModeByZoom(INITIAL_ZOOM),
  );
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);
  const mapWrapRef = useRef<HTMLDivElement | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markerByIdRef = useRef<Map<string, L.Marker>>(new Map());
  const focusAppliedRef = useRef(false);
  const autoOpenAppliedRef = useRef(false);
  const dismissedFocusRef = useRef(false);
  const lastFetchKeyRef = useRef<string>("");
  const inFlightFetchKeyRef = useRef<string | null>(null);
  const lastFetchAtRef = useRef(0);
  const [currentZoom, setCurrentZoom] = useState<number>(INITIAL_ZOOM);
  const persistedView = useMemo(() => readPersistedHomeView(), []);
  const [prefGeoJson, setPrefGeoJson] = useState<unknown | null>(null);

  const focus = useMemo(() => {
    const spotId = searchParams.get("spot_id") ?? "";
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const zoom = Number(searchParams.get("zoom"));
    return {
      spotId: spotId || null,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      zoom: Number.isFinite(zoom) ? zoom : null,
    };
  }, [searchParams]);

  const updateMarkers = useCallback((nextSpots: SpotMapItem[]) => {
    if (!clusterRef.current) return;
    clusterRef.current.clearLayers();
    markerByIdRef.current.clear();

    const icon = getMarkerIcon();
    nextSpots.forEach((spot) => {
      const marker = L.marker([spot.lat, spot.lng], { icon });
      marker.on("click", () => {
        router.push(`/gallery/${spot.id}`);
      });
      markerByIdRef.current.set(spot.id, marker);
      clusterRef.current?.addLayer(marker);
    });
  }, [router]);

  useImperativeHandle(
    ref,
    () => ({
      setZoom: (zoom: number) => {
        mapRef.current?.setZoom(zoom);
      },
      locate: () => {
        const map = mapRef.current;
        if (!map) return;
        if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            map.setView([pos.coords.latitude, pos.coords.longitude], Math.max(map.getZoom(), 14));
          },
          () => {
            // ignore
          },
          { enableHighAccuracy: true, timeout: 7000, maximumAge: 60_000 },
        );
      },
    }),
    [],
  );

  useEffect(() => {
    if (!mapReady) return;
    if (!Number.isFinite(requestedZoom ?? NaN)) return;
    mapRef.current?.setZoom(requestedZoom as number);
  }, [mapReady, requestedZoom]);

  useEffect(() => {
    if (!mapReady) return;
    if (!recenterSignal) return;
    if (!initialCenter || !Number.isFinite(initialCenter.lat) || !Number.isFinite(initialCenter.lng)) return;
    const z = typeof initialZoom === "number" && Number.isFinite(initialZoom) ? initialZoom : INITIAL_ZOOM;
    mapRef.current?.setView([initialCenter.lat, initialCenter.lng], z, { animate: false });
  }, [mapReady, recenterSignal, initialCenter, initialZoom]);

  useEffect(() => {
    if (!mapReady) return;
    if (!locateSignal) return;
    const map = mapRef.current;
    if (!map) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], Math.max(map.getZoom(), 14));
      },
      () => {
        // ignore
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 60_000 },
    );
  }, [mapReady, locateSignal]);

  const fetchSpots = useCallback(
    async (map: LeafletMap) => {
      try {
        if (debug) console.log("[spots] fetch start");
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        setCurrentZoom(zoom);
        const fetchKey = [
          zoom,
          bounds.getSouth().toFixed(5),
          bounds.getWest().toFixed(5),
          bounds.getNorth().toFixed(5),
          bounds.getEast().toFixed(5),
        ].join(":");

        const now = Date.now();
        const isSameAsLast = fetchKey === lastFetchKeyRef.current;
        const tooSoon = now - lastFetchAtRef.current < 700;
        if (isSameAsLast && tooSoon) {
          if (debug) console.log("[spots] skip duplicate fetch", fetchKey);
          return;
        }
        if (inFlightFetchKeyRef.current === fetchKey) {
          if (debug) console.log("[spots] skip inflight fetch", fetchKey);
          return;
        }

        inFlightFetchKeyRef.current = fetchKey;
        lastFetchAtRef.current = now;
        setLoading(true);

        const params = new URLSearchParams({
          bounds: `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`,
          zoom: String(zoom),
        });

        const response = await fetch(`/api/spots?${params.toString()}`, {
          cache: "no-store",
        });
        setLoading(false);
        if (!response.ok) {
          if (debug) {
            console.warn("[spots] fetch failed", response.status, await response.text());
          }
          return;
        }

        const payload = (await response.json()) as { spots: SpotMapItem[] };
        if (debug) {
          console.log("[spots] fetched", {
            zoom,
            count: payload.spots?.length ?? 0,
            bounds: {
              south: bounds.getSouth(),
              west: bounds.getWest(),
              north: bounds.getNorth(),
              east: bounds.getEast(),
            },
          });
        }
        setSpots(payload.spots);
        lastFetchKeyRef.current = fetchKey;

        // NOTE:
        // We intentionally do NOT auto-open the detail panel on upload redirect.
        // focus params are used only for map positioning / bubble targeting.
        if (!autoOpenAppliedRef.current && focus.spotId) {
          autoOpenAppliedRef.current = true;
        }
      } catch (e) {
        setLoading(false);
        if (debug) console.error("[spots] fetch threw", e);
      } finally {
        inFlightFetchKeyRef.current = null;
      }
    },
    [focus.spotId, debug],
  );
  const onZoomChanged = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
    setDisplayMode(getDisplayModeByZoom(zoom));
  }, []);

  const onMapReady = useCallback(
    (map: LeafletMap) => {
      if (clusterRef.current) return;
      mapRef.current = map;
      setMapReady(true);
      if (debug) console.log("[map] ready");

      // Apply initial view before any fetch/paint drift.
      if (!focusAppliedRef.current) {
        const fallbackLat = INITIAL_CENTER[0];
        const fallbackLng = INITIAL_CENTER[1];
        const lat =
          typeof initialCenter?.lat === "number" && Number.isFinite(initialCenter.lat)
            ? initialCenter.lat
            : typeof persistedView?.lat === "number" && Number.isFinite(persistedView.lat)
              ? persistedView.lat
            : fallbackLat;
        const lng =
          typeof initialCenter?.lng === "number" && Number.isFinite(initialCenter.lng)
            ? initialCenter.lng
            : typeof persistedView?.lng === "number" && Number.isFinite(persistedView.lng)
              ? persistedView.lng
            : fallbackLng;
        const z =
          typeof initialZoom === "number" && Number.isFinite(initialZoom)
            ? initialZoom
            : typeof persistedView?.zoom === "number" && Number.isFinite(persistedView.zoom)
              ? persistedView.zoom
            : INITIAL_ZOOM;
        map.setView([lat, lng], z, { animate: false });
        focusAppliedRef.current = true;
      }

      if (!focusAppliedRef.current && focus.lat != null && focus.lng != null) {
        map.setView([focus.lat, focus.lng], focus.zoom ?? 16);
        focusAppliedRef.current = true;
      }

      // If no focus is provided, center to current location (best-effort).
      if (
        !focusAppliedRef.current &&
        typeof navigator !== "undefined" &&
        "geolocation" in navigator
      ) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (focusAppliedRef.current) return;
            map.setView([pos.coords.latitude, pos.coords.longitude], 14);
            focusAppliedRef.current = true;
          },
          () => {
            // Ignore errors and keep default initial center.
          },
          { enableHighAccuracy: true, timeout: 7000, maximumAge: 60_000 },
        );
      }

      const markerClusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        // 県レベル(=12)以上では完全に個別ピン表示にする。
        disableClusteringAtZoom: 12,
        // クラスタ判定距離(px)。狭めるほど孤立ピンが個別表示されやすい。
        maxClusterRadius: 24,
        spiderfyOnMaxZoom: true,
      });
      // Cluster should zoom/spiderfy, not navigate to gallery (prevents /gallery/cluster:...).
      markerClusterGroup.on("clusterclick", (e) => {
        const m = mapRef.current;
        if (!m) return;
        const target = e?.layer as unknown as { zoomToBounds?: () => void; spiderfy?: () => void } | undefined;
        if (target?.zoomToBounds) target.zoomToBounds();
        else if (target?.spiderfy) target.spiderfy();
      });
      clusterRef.current = markerClusterGroup;
      map.addLayer(markerClusterGroup);
      void fetchSpots(map);
    },
    [fetchSpots, focus.lat, focus.lng, focus.zoom, debug, initialCenter, initialZoom, persistedView],
  );

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;
    void fetchSpots(map);
  }, [mapReady, fetchSpots]);

  // Note: we intentionally omit any popup/bubble UI.

  const visibleSpots = useMemo(() => {
    const keyword = (query ?? "").trim().toLowerCase();
    if (!keyword) return spots;
    return spots.filter((s) => {
      const hay = `${s.name} ${s.address ?? ""}`.toLowerCase();
      return hay.includes(keyword);
    });
  }, [spots, query]);

  useEffect(() => {
    if (!mapReady) return;
    updateMarkers(visibleSpots);
  }, [mapReady, visibleSpots, updateMarkers]);

  // (bubble/canvas drawing removed)

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (focus.lat == null || focus.lng == null) return;
    if (dismissedFocusRef.current) return;

    // When navigating with focus params, always re-center & refetch.
    map.setView([focus.lat, focus.lng], focus.zoom ?? 16, { animate: false });
    if (!dismissedFocusRef.current) autoOpenAppliedRef.current = false;
    focusAppliedRef.current = true;
    // Wait for Leaflet to apply the new view/bounds before fetching.
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => {
          void fetchSpots(map);
        }),
      );
    } else {
      void fetchSpots(map);
    }
  }, [mapReady, focus.lat, focus.lng, focus.zoom, fetchSpots]);

  useEffect(() => {
    const map = mapRef.current;
    const wrap = mapWrapRef.current;
    if (!map || !wrap || !mapReady) return;
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [mapReady]);

  useEffect(() => {
    return () => {
      if (clusterRef.current && mapRef.current) {
        mapRef.current.removeLayer(clusterRef.current);
      }
    };
  }, []);

  const modeLabel = useMemo(() => {
    const labels: Record<DisplayMode, string> = {
      world: "世界",
      country: "国",
      region: "地方",
      prefecture: "県",
      city: "市",
      spot: "個別スポット",
      detail: "スポット詳細",
    };
    return labels[displayMode];
  }, [displayMode]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(PREF_BORDERS_URL, { cache: "force-cache" });
        if (!res.ok) return;
        const data = (await res.json()) as unknown;
        if (cancelled) return;
        setPrefGeoJson(data);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const prefStyle = useMemo(() => {
    const z = Number.isFinite(currentZoom) ? currentZoom : INITIAL_ZOOM;
    const weight = z >= 12 ? 3 : z >= 9 ? 2 : 1;
    const opacity = z >= 9 ? 0.65 : 0.45;
    return {
      color: "#0058bd",
      weight,
      opacity,
      fillOpacity: 0,
    } as L.PathOptions;
  }, [currentZoom]);

  return (
    <section className="relative rounded-lg border">
      {showInternalControls ? (
        <div className="absolute top-3 right-3 z-500 rounded-md bg-surface/95 px-3 py-1 text-xs text-on-surface shadow">
          表示モード: {modeLabel} {loading ? "(更新中)" : ""}
        </div>
      ) : null}

      {debug ? (
        <div className="absolute bottom-3 left-3 z-700 rounded-md bg-black/70 px-3 py-2 text-[11px] text-white">
          <div>debug: {String(debugParam ?? "null")}</div>
          <div>mapReady: {String(mapReady)}</div>
          <div>spots: {spots.length}</div>
          <div>zoom: {Number.isFinite(currentZoom) ? currentZoom : "?"}</div>
          <div>focusSpotId: {focus.spotId ? focus.spotId.slice(0, 8) : "null"}</div>
        </div>
      ) : null}

      <div
        ref={mapWrapRef}
        className={mapWrapClassName ?? "relative h-[62vh] w-full sm:h-[70vh]"}
      >
        <MapContainer
          center={
            initialCenter && Number.isFinite(initialCenter.lat) && Number.isFinite(initialCenter.lng)
              ? [initialCenter.lat, initialCenter.lng]
              : persistedView && Number.isFinite(persistedView.lat) && Number.isFinite(persistedView.lng)
                ? [persistedView.lat, persistedView.lng]
              : INITIAL_CENTER
          }
          zoom={
            typeof initialZoom === "number" && Number.isFinite(initialZoom)
              ? initialZoom
              : typeof persistedView?.zoom === "number" && Number.isFinite(persistedView.zoom)
                ? persistedView.zoom
                : INITIAL_ZOOM
          }
          minZoom={2}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            // Japanese-labeled tiles (OpenStreetMap Japan).
            url="https://{s}.tile.openstreetmap.jp/{z}/{x}/{y}.png"
            subdomains={["a", "b", "c"]}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://openstreetmap.jp/">OpenStreetMap Japan</a>'
          />
          {prefGeoJson && currentZoom >= 6 ? (
            <GeoJSON data={prefGeoJson as never} style={() => prefStyle} />
          ) : null}
          <MapInitializer onReady={onMapReady} />
          <ModeSync onZoom={onZoomChanged} />
          <MapEventBridge onBoundsChange={fetchSpots} onViewChange={onViewChange} />
        </MapContainer>
      </div>
    </section>
  );
});

export default MapViewClient;
