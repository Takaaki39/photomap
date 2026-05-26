"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import { useRouter, useSearchParams } from "next/navigation";
import { GeoJSON, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import {
  type SpotMapItem,
  filterSpotsInBounds,
  getAllSpotsSnapshot,
  hasAllSpotsSnapshot,
  refreshAllSpotsSnapshot,
} from "@/lib/spotsBoundsCache";
import { getMapPinDivIcon, setMarkerOverlayIcon, type MapPinOverlayKey } from "@/lib/mapPinIcon";
import {
  isPersistableHomeMapView,
  readHomeMapView,
  writeHomeMapView,
} from "@/lib/homeMapView";
import { filterSpotsByTag, type PhotoTagFilter } from "@/lib/photoTag";
import { filterSpotsByPeriod, type PeriodKey } from "@/lib/spotPeriod";

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

function getDisplayModeByZoom(zoom: number): DisplayMode {
  if (zoom <= 3) return "world";
  if (zoom <= 6) return "country";
  if (zoom <= 9) return "region";
  if (zoom <= 12) return "prefecture";
  if (zoom <= 15) return "city";
  if (zoom >= 16) return "detail";
  return "spot";
}

export type MapViewHandle = {
  setZoom: (zoom: number) => void;
  locate: () => void;
};

// moveend と zoomend は 1 ジェスチャ中に複数回（時には両方）発火するため、
// ピン再描画/スポット再フィルタは末尾デバウンスでまとめる。
const VIEWPORT_APPLY_DEBOUNCE_MS = 150;

function MapEventBridge({
  onBoundsChange,
  onViewChange,
}: {
  onBoundsChange: (map: LeafletMap) => void;
  onViewChange?: (v: { lat: number; lng: number; zoom: number }) => void;
}) {
  const timerRef = useRef<number | null>(null);
  const scheduleApply = useCallback(
    (map: LeafletMap) => {
      if (typeof window === "undefined") {
        onBoundsChange(map);
        return;
      }
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        onBoundsChange(map);
      }, VIEWPORT_APPLY_DEBOUNCE_MS);
    },
    [onBoundsChange],
  );
  useEffect(
    () => () => {
      if (typeof window !== "undefined" && timerRef.current != null) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );
  const map = useMapEvents({
    moveend: () => {
      scheduleApply(map);
      if (onViewChange) {
        const c = map.getCenter();
        onViewChange({ lat: c.lat, lng: c.lng, zoom: map.getZoom() });
      }
    },
    zoomend: () => {
      scheduleApply(map);
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

/** invalidateSize 後も保存済みビューへ戻す（コンテナ 0px 初期化による世界地図化を防ぐ） */
function RestoreMapView({
  view,
  viewSaveEnabledRef,
}: {
  view: { lat: number; lng: number; zoom: number };
  viewSaveEnabledRef: RefObject<boolean>;
}) {
  const map = useMap();

  useEffect(() => {
    let cancelled = false;
    viewSaveEnabledRef.current = false;

    const apply = () => {
      if (cancelled) return;
      map.setView([view.lat, view.lng], view.zoom, { animate: false });
    };

    apply();
    const raf = window.requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
      apply();
      window.setTimeout(() => {
        if (!cancelled) viewSaveEnabledRef.current = true;
      }, 400);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      viewSaveEnabledRef.current = false;
    };
  }, [map, view.lat, view.lng, view.zoom, viewSaveEnabledRef]);

  return null;
}

const MapViewClient = forwardRef<
  MapViewHandle,
  {
    query?: string;
    showInternalControls?: boolean;
    locateSignal?: number;
    initialCenter?: { lat: number; lng: number } | null;
    initialZoom?: number;
    recenterSignal?: number;
    onViewChange?: (v: { lat: number; lng: number; zoom: number }) => void;
    mapWrapClassName?: string;
    /** ピンの表示期間（スポットの最新写真日時で絞り込む）。未指定/all は絞り込みなし */
    period?: PeriodKey;
    /** ピンのタグ絞り込み。"all" または未指定で絞り込みなし */
    tagFilter?: PhotoTagFilter;
    /** ピンベース上に重ねるアイコン（lib/mapPinIcon.ts の MAP_PIN_OVERLAYS） */
    pinOverlay?: MapPinOverlayKey;
  }
>(function MapViewClient(
  {
    query,
    showInternalControls = true,
    locateSignal,
    initialCenter,
    initialZoom,
    recenterSignal,
    onViewChange,
    mapWrapClassName,
    period,
    tagFilter,
    pinOverlay = "default",
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
  const pinOverlayRef = useRef<MapPinOverlayKey>("default");
  const focusAppliedRef = useRef(false);
  const autoOpenAppliedRef = useRef(false);
  const dismissedFocusRef = useRef(false);
  const inFlightFetchKeyRef = useRef<string | null>(null);
  const viewSaveEnabledRef = useRef(false);
  const lastKnownViewRef = useRef<{ lat: number; lng: number; zoom: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(INITIAL_ZOOM);
  const bootView = useMemo(() => readHomeMapView(), []);
  const [prefGeoJson, setPrefGeoJson] = useState<unknown | null>(null);
  const [containerReady, setContainerReady] = useState(false);

  const restoreTargetView = useMemo(() => {
    const saved = bootView ?? readHomeMapView();
    const lat =
      typeof initialCenter?.lat === "number" && Number.isFinite(initialCenter.lat)
        ? initialCenter.lat
        : saved?.lat ?? INITIAL_CENTER[0];
    const lng =
      typeof initialCenter?.lng === "number" && Number.isFinite(initialCenter.lng)
        ? initialCenter.lng
        : saved?.lng ?? INITIAL_CENTER[1];
    const zoom =
      typeof initialZoom === "number" && Number.isFinite(initialZoom)
        ? initialZoom
        : saved?.zoom ?? INITIAL_ZOOM;
    return { lat, lng, zoom };
  }, [bootView, initialCenter, initialZoom]);

  useLayoutEffect(() => {
    const el = mapWrapRef.current;
    if (!el) return;

    const check = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) setContainerReady(true);
    };

    check();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (bootView && isPersistableHomeMapView(bootView)) lastKnownViewRef.current = bootView;
  }, [bootView]);

  const persistView = useCallback((view: { lat: number; lng: number; zoom: number }) => {
    if (!isPersistableHomeMapView(view)) return;
    lastKnownViewRef.current = view;
    writeHomeMapView(view);
  }, []);

  const handleViewChange = useCallback(
    (v: { lat: number; lng: number; zoom: number }) => {
      if (!viewSaveEnabledRef.current) return;
      persistView(v);
      onViewChange?.(v);
    },
    [onViewChange, persistView],
  );

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
    const cluster = clusterRef.current;
    if (!cluster) return;

    // パン/ズームのたびに全マーカーを clearLayers → addLayer すると、
    // 表示数に比例して描画コストが線形に跳ね上がる。
    // 既存マーカーは ID で再利用し、新規追加・削除分のみを cluster に渡す（差分更新）。
    const prev = markerByIdRef.current;
    const next = new Map<string, L.Marker>();
    const toAdd: L.Marker[] = [];
    const toRemove: L.Marker[] = [];
    const icon = getMapPinDivIcon(pinOverlay);
    const overlayChanged = pinOverlayRef.current !== pinOverlay;
    if (overlayChanged) pinOverlayRef.current = pinOverlay;

    for (const spot of nextSpots) {
      const existing = prev.get(spot.id);
      if (existing) {
        const ll = existing.getLatLng();
        if (ll.lat !== spot.lat || ll.lng !== spot.lng) {
          existing.setLatLng([spot.lat, spot.lng]);
        }
        if (overlayChanged) setMarkerOverlayIcon(existing, pinOverlay);
        next.set(spot.id, existing);
        continue;
      }
      const marker = L.marker([spot.lat, spot.lng], { icon });
      (marker.options as Record<string, string>).spotId = spot.id;
      marker.on("click", () => {
        try {
          const z = mapRef.current?.getZoom() ?? INITIAL_ZOOM;
          persistView({ lat: spot.lat, lng: spot.lng, zoom: z });
        } catch {
          // ignore
        }
        router.push(`/gallery/${spot.id}`);
      });
      next.set(spot.id, marker);
      toAdd.push(marker);
    }

    for (const [id, marker] of prev) {
      if (!next.has(id)) toRemove.push(marker);
    }

    if (toRemove.length > 0) cluster.removeLayers(toRemove);
    if (toAdd.length > 0) cluster.addLayers(toAdd);
    if (toRemove.length > 0 || toAdd.length > 0) cluster.refreshClusters();
    markerByIdRef.current = next;
  }, [pinOverlay, persistView, router]);

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
    if (!recenterSignal) return;
    if (!initialCenter || !Number.isFinite(initialCenter.lat) || !Number.isFinite(initialCenter.lng)) return;
    const z = typeof initialZoom === "number" && Number.isFinite(initialZoom) ? initialZoom : INITIAL_ZOOM;
    const next = { lat: initialCenter.lat, lng: initialCenter.lng, zoom: z };
    mapRef.current?.setView([next.lat, next.lng], next.zoom, { animate: false });
    if (isPersistableHomeMapView(next)) lastKnownViewRef.current = next;
    viewSaveEnabledRef.current = false;
    const t = window.setTimeout(() => {
      viewSaveEnabledRef.current = true;
    }, 400);
    return () => window.clearTimeout(t);
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

  const applySpotsForViewport = useCallback(
    async (map: LeafletMap) => {
      try {
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        setCurrentZoom(zoom);
        const south = bounds.getSouth();
        const west = bounds.getWest();
        const north = bounds.getNorth();
        const east = bounds.getEast();

        const applyFiltered = (snapshot: SpotMapItem[]) => {
          // クラスタ中に remove/add が走ると「集まった後に再び離れる」ちらつきが出るため、
          // マーカーは全件スナップショットを保持し、表示範囲フィルタはクラスタ側に任せる。
          if (debug) {
            const visible = filterSpotsInBounds(snapshot, south, west, north, east);
            console.log("[spots] snapshot", {
              zoom,
              total: snapshot.length,
              inViewport: visible.length,
            });
          }
          setSpots(snapshot);
          if (!autoOpenAppliedRef.current && focus.spotId) {
            autoOpenAppliedRef.current = true;
          }
        };

        if (hasAllSpotsSnapshot()) {
          applyFiltered(getAllSpotsSnapshot() ?? []);
          return;
        }

        if (inFlightFetchKeyRef.current === "all") {
          if (debug) console.log("[spots] skip inflight full snapshot fetch");
          return;
        }

        inFlightFetchKeyRef.current = "all";
        setLoading(true);
        const ok = await refreshAllSpotsSnapshot();
        setLoading(false);
        if (!ok) {
          if (debug) console.warn("[spots] full snapshot fetch failed");
          return;
        }
        applyFiltered(getAllSpotsSnapshot() ?? []);
      } catch (e) {
        setLoading(false);
        if (debug) console.error("[spots] viewport apply threw", e);
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

      // RestoreMapView が初回ビューを適用する。ここでは ref のみ同期。
      if (!focusAppliedRef.current) {
        if (focus.lat != null && focus.lng != null) {
          map.setView([focus.lat, focus.lng], focus.zoom ?? 16, { animate: false });
        } else if (isPersistableHomeMapView(restoreTargetView)) {
          lastKnownViewRef.current = restoreTargetView;
        }
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
        // プラグイン既定の「クリックで範囲ズーム」は無効化（自前の clusterclick でギャラリーへ）
        zoomToBoundsOnClick: false,
        // 画面外判定でクラスタが消えるのを防ぐ（重なり付近で見えなくなるケースの抑止）
        removeOutsideVisibleBounds: false,
        // 全ズームでピクセル近傍のマーカーをクラスタ化（重なり・近接はまとめ、離れると個別表示）
        maxClusterRadius: 42,
        spiderfyOnMaxZoom: false,
      });
      markerClusterGroup.on("clusterclick", (e) => {
        const cluster = e.layer as L.MarkerCluster;
        const children = cluster.getAllChildMarkers?.() ?? [];
        const ids = [
          ...new Set(
            children
              .map((m) => (m.options as { spotId?: string }).spotId)
              .filter((id): id is string => Boolean(id)),
          ),
        ];

        // ギャラリーへ遷移する場合のみ、戻った時にクラスタ中心へ戻れるよう lastView を上書きする。
        const persistClusterCenter = () => {
          try {
            const center = cluster.getLatLng();
            const z = mapRef.current?.getZoom() ?? INITIAL_ZOOM;
            persistView({ lat: center.lat, lng: center.lng, zoom: z });
          } catch {
            // ignore
          }
        };

        if (ids.length >= 2) {
          persistClusterCenter();
          const galleryId = `cluster:spots~${ids.join("~")}`;
          router.push(`/gallery/${encodeURIComponent(galleryId)}`);
          return;
        }
        if (ids.length === 1) {
          persistClusterCenter();
          router.push(`/gallery/${ids[0]}`);
          return;
        }
        cluster.zoomToBounds?.();
      });
      clusterRef.current = markerClusterGroup;
      map.addLayer(markerClusterGroup);
      void applySpotsForViewport(map);
    },
    [applySpotsForViewport, focus.lat, focus.lng, focus.zoom, debug, persistView, restoreTargetView, router],
  );

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;
    void applySpotsForViewport(map);
  }, [mapReady, applySpotsForViewport]);

  // Note: we intentionally omit any popup/bubble UI.

  const visibleSpots = useMemo(() => {
    const keyword = (query ?? "").trim().toLowerCase();
    const byKeyword = keyword
      ? spots.filter((s) => {
          const hay = `${s.name} ${s.address ?? ""}`.toLowerCase();
          return hay.includes(keyword);
        })
      : spots;
    const byPeriod =
      !period || period === "all" ? byKeyword : filterSpotsByPeriod(byKeyword, period);
    const byTag =
      !tagFilter || tagFilter === "all" ? byPeriod : filterSpotsByTag(byPeriod, tagFilter);
    return byTag;
  }, [spots, query, period, tagFilter]);

  useEffect(() => {
    if (!mapReady) return;
    updateMarkers(visibleSpots);
  }, [mapReady, visibleSpots, updateMarkers]);

  // (bubble/canvas drawing removed)

  useEffect(() => {
    const flush = () => {
      const v = lastKnownViewRef.current;
      if (v) writeHomeMapView(v);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      viewSaveEnabledRef.current = false;
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

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
          void applySpotsForViewport(map);
        }),
      );
    } else {
      void applySpotsForViewport(map);
    }
  }, [mapReady, focus.lat, focus.lng, focus.zoom, applySpotsForViewport]);

  useEffect(() => {
    const map = mapRef.current;
    const wrap = mapWrapRef.current;
    if (!map || !wrap || !mapReady) return;
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      viewSaveEnabledRef.current = false;
      map.invalidateSize({ pan: false });
      const v = lastKnownViewRef.current;
      if (v) map.setView([v.lat, v.lng], v.zoom, { animate: false });
      window.setTimeout(() => {
        viewSaveEnabledRef.current = true;
      }, 400);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [mapReady]);

  useEffect(() => {
    return () => {
      if (clusterRef.current && mapRef.current) {
        mapRef.current.removeLayer(clusterRef.current);
      }
      clusterRef.current = null;
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
    <section
      className={
        showInternalControls
          ? "leaflet-viewport-below-header relative rounded-lg border"
          : "leaflet-viewport-below-header relative h-full w-full"
      }
    >
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
        {containerReady ? (
        <MapContainer
          center={[restoreTargetView.lat, restoreTargetView.lng]}
          zoom={restoreTargetView.zoom}
          minZoom={2}
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            // Japanese-labeled tiles (OpenStreetMap Japan).
            url="https://{s}.tile.openstreetmap.jp/{z}/{x}/{y}.png"
            subdomains={["a", "b", "c"]}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://openstreetmap.jp/">OpenStreetMap Japan</a>'
            // ズーム中はタイル取得をスキップし、ジェスチャ確定後に一括取得する（描画コマ落ち抑制）
            updateWhenZooming={false}
            // パン中も即時タイル取得（モバイル既定の "待つ" 挙動を無効化して体感を改善）
            updateWhenIdle={false}
            // 画面外バッファを厚く（戻り・近傍ズームでキャッシュヒットしやすくする）
            keepBuffer={6}
            // ServiceWorker のレスポンスキャッシュ要件（CORS 経由でも opaque ではなく保存可能にする）
            crossOrigin="anonymous"
          />
          {prefGeoJson && currentZoom >= 6 ? (
            <GeoJSON data={prefGeoJson as never} style={() => prefStyle} />
          ) : null}
          <RestoreMapView view={restoreTargetView} viewSaveEnabledRef={viewSaveEnabledRef} />
          <MapInitializer onReady={onMapReady} />
          <ModeSync onZoom={onZoomChanged} />
          <MapEventBridge onBoundsChange={applySpotsForViewport} onViewChange={handleViewChange} />
        </MapContainer>
        ) : null}
      </div>

    </section>
  );
});

export default MapViewClient;
