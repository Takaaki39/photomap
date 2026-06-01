import { useEffect, useState } from "react";
import { readHomeMapView } from "@/lib/homeMapView";

type MapCenter = { lat: number; lng: number };

async function fetchIpLocation(): Promise<MapCenter | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!res.ok) return null;
    const d = (await res.json()) as { latitude?: number; longitude?: number };
    const lat = d.latitude;
    const lng = d.longitude;
    if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 初回マップ表示時の中心座標を決定する。
 * 保存済み view があればそれを優先し、なければ GPS → IP フォールバック。
 */
export function useInitialMapCenter() {
  const bootView = readHomeMapView();
  const [initialCenter, setInitialCenter] = useState<MapCenter | null>(
    bootView ? { lat: bootView.lat, lng: bootView.lng } : null,
  );
  const [zoom, setZoom] = useState(bootView?.zoom ?? 11);
  const [recenterSignal, setRecenterSignal] = useState(bootView ? 1 : 0);

  useEffect(() => {
    if (bootView) return;

    let cancelled = false;

    const finish = (center: MapCenter | null) => {
      if (cancelled || !center) return;
      setInitialCenter(center);
      setZoom(14);
      setRecenterSignal((v) => v + 1);
    };

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => finish({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        async () => finish(await fetchIpLocation()),
        { enableHighAccuracy: true, timeout: 1800, maximumAge: 60_000 },
      );
    } else {
      void fetchIpLocation().then(finish);
    }

    return () => {
      cancelled = true;
    };
  }, [bootView]);

  return { initialCenter, zoom, recenterSignal, hasBootView: Boolean(bootView) };
}
