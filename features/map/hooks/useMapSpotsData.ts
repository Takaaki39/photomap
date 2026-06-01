"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import {
  type SpotMapItem,
  filterSpotsInBounds,
  getAllSpotsSnapshot,
  hasAllSpotsSnapshot,
  refreshAllSpotsSnapshot,
} from "@/features/map/store/spotsBoundsCache";
import { filterSpotsByTag, type PhotoTagFilter } from "@/lib/photoTag";
import { filterSpotsByPeriod, type PeriodKey } from "@/lib/spotPeriod";

export function useMapSpotsData(options: {
  query?: string;
  period?: PeriodKey;
  tagFilter?: PhotoTagFilter;
  focusSpotId: string | null;
  debug: boolean;
}) {
  const { query, period, tagFilter, focusSpotId, debug } = options;
  const [spots, setSpots] = useState<SpotMapItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inFlightFetchKeyRef = useRef<string | null>(null);
  const autoOpenAppliedRef = useRef(false);

  const applySpotsForViewport = useCallback(
    async (map: LeafletMap) => {
      try {
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        const south = bounds.getSouth();
        const west = bounds.getWest();
        const north = bounds.getNorth();
        const east = bounds.getEast();

        const applyFiltered = (snapshot: SpotMapItem[]) => {
          if (debug) {
            const visible = filterSpotsInBounds(snapshot, south, west, north, east);
            console.log("[spots] snapshot", {
              zoom,
              total: snapshot.length,
              inViewport: visible.length,
            });
          }
          setSpots(snapshot);
          if (!autoOpenAppliedRef.current && focusSpotId) {
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
    [focusSpotId, debug],
  );

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

  return { spots, loading, visibleSpots, applySpotsForViewport, autoOpenAppliedRef };
}
