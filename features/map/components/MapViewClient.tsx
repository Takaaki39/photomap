"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Map as LeafletMap } from "leaflet";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import { getDisplayModeByZoom, DISPLAY_MODE_LABELS } from "../lib/displayMode";
import {
  MapEventBridge,
  MapInitializer,
  ModeSync,
  RestoreMapView,
} from "./MapLeafletBridge";
import { useMapViewPersistence } from "../hooks/useMapViewPersistence";
import { useMapUrlFocus, useMapDebugFlag } from "../hooks/useMapUrlFocus";
import { useMapSpotsData } from "../hooks/useMapSpotsData";
import { useMapMarkerCluster } from "../hooks/useMapMarkerCluster";
import { usePrefectureBorders } from "../hooks/usePrefectureBorders";
import { INITIAL_ZOOM } from "../constants";
import { isPersistableHomeMapView } from "@/lib/homeMapView";
import type { MapPinOverlayKey } from "@/lib/mapPinIcon";
import type { PhotoTagFilter } from "@/lib/photoTag";
import type { PeriodKey } from "@/lib/spotPeriod";
import type { MapViewHandle } from "../types";

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
    period?: PeriodKey;
    tagFilter?: PhotoTagFilter;
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
  const { debug, debugParam } = useMapDebugFlag();
  const focus = useMapUrlFocus();
  const {
    restoreTargetView,
    viewSaveEnabledRef,
    lastKnownViewRef,
    persistView,
    handleViewChange,
  } = useMapViewPersistence({ initialCenter, initialZoom, onViewChange });

  const { spots, loading, visibleSpots, applySpotsForViewport, autoOpenAppliedRef } =
    useMapSpotsData({
      query,
      period,
      tagFilter,
      focusSpotId: focus.spotId,
      debug,
    });

  const { mapRef, setupClusterOnMap, updateMarkers } = useMapMarkerCluster({
    pinOverlay,
    persistView,
    debug,
  });

  const [displayMode, setDisplayMode] = useState(() =>
    getDisplayModeByZoom(INITIAL_ZOOM),
  );
  const [mapReady, setMapReady] = useState(false);
  const mapWrapRef = useRef<HTMLDivElement | null>(null);
  const focusAppliedRef = useRef(false);
  const dismissedFocusRef = useRef(false);
  const [currentZoom, setCurrentZoom] = useState<number>(INITIAL_ZOOM);
  const [containerReady, setContainerReady] = useState(false);

  const { prefGeoJson, prefStyle } = usePrefectureBorders(currentZoom);

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
          () => {},
          { enableHighAccuracy: true, timeout: 7000, maximumAge: 60_000 },
        );
      },
    }),
    [mapRef],
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
  }, [mapReady, recenterSignal, initialCenter, initialZoom, lastKnownViewRef, mapRef, viewSaveEnabledRef]);

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
      () => {},
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 60_000 },
    );
  }, [mapReady, locateSignal, mapRef]);

  const onZoomChanged = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
    setDisplayMode(getDisplayModeByZoom(zoom));
  }, []);

  const onMapReady = useCallback(
    (map: LeafletMap) => {
      setupClusterOnMap(map);
      setMapReady(true);

      if (!focusAppliedRef.current) {
        if (focus.lat != null && focus.lng != null) {
          map.setView([focus.lat, focus.lng], focus.zoom ?? 16, { animate: false });
        } else if (isPersistableHomeMapView(restoreTargetView)) {
          lastKnownViewRef.current = restoreTargetView;
        }
        focusAppliedRef.current = true;
      }

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
          () => {},
          { enableHighAccuracy: true, timeout: 7000, maximumAge: 60_000 },
        );
      }

      void applySpotsForViewport(map);
    },
    [
      applySpotsForViewport,
      focus.lat,
      focus.lng,
      focus.zoom,
      lastKnownViewRef,
      restoreTargetView,
      setupClusterOnMap,
    ],
  );

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;
    void applySpotsForViewport(map);
  }, [mapReady, applySpotsForViewport, mapRef]);

  useEffect(() => {
    if (!mapReady) return;
    updateMarkers(visibleSpots);
  }, [mapReady, visibleSpots, updateMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (focus.lat == null || focus.lng == null) return;
    if (dismissedFocusRef.current) return;

    map.setView([focus.lat, focus.lng], focus.zoom ?? 16, { animate: false });
    if (!dismissedFocusRef.current) autoOpenAppliedRef.current = false;
    focusAppliedRef.current = true;

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => {
          void applySpotsForViewport(map);
        }),
      );
    } else {
      void applySpotsForViewport(map);
    }
  }, [mapReady, focus.lat, focus.lng, focus.zoom, applySpotsForViewport, autoOpenAppliedRef, mapRef]);

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
  }, [mapReady, lastKnownViewRef, mapRef, viewSaveEnabledRef]);

  const modeLabel = DISPLAY_MODE_LABELS[displayMode];

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
              url="https://{s}.tile.openstreetmap.jp/{z}/{x}/{y}.png"
              subdomains={["a", "b", "c"]}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://openstreetmap.jp/">OpenStreetMap Japan</a>'
              updateWhenZooming={false}
              updateWhenIdle={false}
              keepBuffer={6}
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
export { MapViewClient };
export type { MapViewHandle } from "../types";
