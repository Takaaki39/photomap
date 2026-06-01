"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { Map as LeafletMap } from "leaflet";
import { useMap, useMapEvents } from "react-leaflet";
import { VIEWPORT_APPLY_DEBOUNCE_MS } from "../constants";
import type { MapViewCoords } from "../types";

export function MapEventBridge({
  onBoundsChange,
  onViewChange,
}: {
  onBoundsChange: (map: LeafletMap) => void;
  onViewChange?: (v: MapViewCoords) => void;
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

export function MapInitializer({ onReady }: { onReady: (map: LeafletMap) => void }) {
  const map = useMapEvents({});
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

export function ModeSync({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => onZoom(map.getZoom()),
  });
  useEffect(() => {
    onZoom(map.getZoom());
  }, [map, onZoom]);
  return null;
}

/** invalidateSize 後も保存済みビューへ戻す（コンテナ 0px 初期化による世界地図化を防ぐ） */
export function RestoreMapView({
  view,
  viewSaveEnabledRef,
}: {
  view: MapViewCoords;
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
