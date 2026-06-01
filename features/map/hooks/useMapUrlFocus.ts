"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { MapFocusParams } from "../types";

export function useMapUrlFocus(): MapFocusParams {
  const searchParams = useSearchParams();

  return useMemo(() => {
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
}

export function useMapDebugFlag(): { debug: boolean; debugParam: string | null } {
  const searchParams = useSearchParams();
  const debugParam = searchParams.get("debug");
  const debug =
    debugParam === "1" ||
    debugParam === "true" ||
    debugParam === "" ||
    debugParam === "yes";
  return { debug, debugParam };
}
