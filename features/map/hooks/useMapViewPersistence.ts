"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  isPersistableHomeMapView,
  readHomeMapView,
  writeHomeMapView,
} from "@/lib/homeMapView";
import { INITIAL_CENTER, INITIAL_ZOOM } from "../constants";
import type { MapViewCoords } from "../types";

export function useMapViewPersistence(options: {
  initialCenter?: { lat: number; lng: number } | null;
  initialZoom?: number;
  onViewChange?: (v: MapViewCoords) => void;
}) {
  const { initialCenter, initialZoom, onViewChange } = options;
  const bootView = useMemo(() => readHomeMapView(), []);
  const viewSaveEnabledRef = useRef(false);
  const lastKnownViewRef = useRef<MapViewCoords | null>(null);

  const restoreTargetView = useMemo((): MapViewCoords => {
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

  useEffect(() => {
    if (bootView && isPersistableHomeMapView(bootView)) {
      lastKnownViewRef.current = bootView;
    }
  }, [bootView]);

  const persistView = useCallback((view: MapViewCoords) => {
    if (!isPersistableHomeMapView(view)) return;
    lastKnownViewRef.current = view;
    writeHomeMapView(view);
  }, []);

  const handleViewChange = useCallback(
    (v: MapViewCoords) => {
      if (!viewSaveEnabledRef.current) return;
      persistView(v);
      onViewChange?.(v);
    },
    [onViewChange, persistView],
  );

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

  return {
    bootView,
    restoreTargetView,
    viewSaveEnabledRef,
    lastKnownViewRef,
    persistView,
    handleViewChange,
  };
}
