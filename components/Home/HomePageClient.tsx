"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HomeBottomRightControls } from "@/components/Home/HomeBottomRightControls";
import { HomeBottomSheetIndicator } from "@/components/Home/HomeBottomSheetIndicator";
import { TopNav } from "@/components/Nav/TopNav";
import { BottomNav } from "@/components/Nav/BottomNav";

const MapViewClient = dynamic(() => import("@/components/Map/MapViewClient"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-surface-container-highest" />,
});

function readLastView(): { center: { lat: number; lng: number } | null; zoom: number | null } {
  if (typeof window === "undefined") return { center: null, zoom: null };
  try {
    const raw = window.localStorage.getItem("home:lastView");
    if (!raw) return { center: null, zoom: null };
    const d = JSON.parse(raw) as { lat?: number; lng?: number; zoom?: number };
    if (typeof d.lat !== "number" || typeof d.lng !== "number") return { center: null, zoom: null };
    if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng)) return { center: null, zoom: null };
    const z = typeof d.zoom === "number" && Number.isFinite(d.zoom) ? d.zoom : null;
    return { center: { lat: d.lat, lng: d.lng }, zoom: z };
  } catch {
    return { center: null, zoom: null };
  }
}

export function HomePageClient() {
  const router = useRouter();
  const [zoom, setZoom] = useState(11);
  const [locateSignal, setLocateSignal] = useState(0);
  const [initialCenter, setInitialCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [recenterSignal, setRecenterSignal] = useState(0);

  useEffect(() => {
    // If user navigated back from another page, Leaflet may start with wrong size.
    // Force a recenter on next tick using the best known center.
    const t = window.setTimeout(() => {
      if (initialCenter) setRecenterSignal((v) => v + 1);
    }, 0);
    return () => window.clearTimeout(t);
  }, [initialCenter]);

  useEffect(() => {
    // Apply last known view AFTER mount to avoid hydration mismatch.
    const t = window.setTimeout(() => {
      const { center, zoom: z } = readLastView();
      if (center) setInitialCenter(center);
      if (typeof z === "number") setZoom(Math.max(2, Math.min(18, z)));
      if (center) setRecenterSignal((v) => v + 1);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const finish = (center: { lat: number; lng: number } | null) => {
      if (cancelled) return;
      setInitialCenter(center);
      setRecenterSignal((v) => v + 1);
    };

    // 1) Try GPS quickly (Google Maps-like).
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => finish({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        async () => {
          // 2) Fallback to IP-based approximate location (no key, best-effort).
          try {
            const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
            if (!res.ok) return finish(null);
            const d = (await res.json()) as { latitude?: number; longitude?: number };
            const lat = d.latitude;
            const lng = d.longitude;
            if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
              finish({ lat, lng });
              return;
            }
            finish(null);
          } catch {
            finish(null);
          }
        },
        { enableHighAccuracy: true, timeout: 1800, maximumAge: 60_000 },
      );
    } else {
      void (async () => {
        try {
          const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
          if (!res.ok) return finish(null);
          const d = (await res.json()) as { latitude?: number; longitude?: number };
          const lat = d.latitude;
          const lng = d.longitude;
          if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
            finish({ lat, lng });
            return;
          }
          finish(null);
        } catch {
          finish(null);
        }
      })();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="home-outlined-typo relative w-full h-svh overflow-hidden bg-background text-on-surface">
      <TopNav />

      <main className="relative h-svh w-full">
        <div className="absolute inset-0 z-0">
          <MapViewClient
            showInternalControls={false}
            requestedZoom={zoom}
            locateSignal={locateSignal}
            initialCenter={initialCenter}
            initialZoom={Math.max(zoom, 11)}
            recenterSignal={recenterSignal}
            mapWrapClassName="relative h-svh w-full"
            onViewChange={(v) => {
              try {
                window.localStorage.setItem("home:lastView", JSON.stringify({ ...v, t: Date.now() }));
              } catch {
                // ignore
              }
            }}
          />
        </div>

        {/* Controls Bottom-Right */}
        <HomeBottomRightControls
          onLocate={() => setLocateSignal((v) => v + 1)}
          onUpload={() => router.push("/upload")}
        />
      </main>

      <BottomNav active="map" />
      <HomeBottomSheetIndicator />
    </div>
  );
}

