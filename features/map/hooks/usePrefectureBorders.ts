"use client";

import { useEffect, useMemo, useState } from "react";
import type L from "leaflet";
import { PREF_BORDERS_URL } from "../constants";
import { INITIAL_ZOOM } from "../constants";

export function usePrefectureBorders(currentZoom: number) {
  const [prefGeoJson, setPrefGeoJson] = useState<unknown | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(PREF_BORDERS_URL, { cache: "force-cache" });
        if (!res.ok) return;
        const data = (await res.json()) as unknown;
        if (!cancelled) setPrefGeoJson(data);
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

  return { prefGeoJson, prefStyle };
}
