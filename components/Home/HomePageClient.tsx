"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { HomeBottomRightControls } from "@/components/Home/HomeBottomRightControls";
import { HomeBottomSheetIndicator } from "@/components/Home/HomeBottomSheetIndicator";
import { TopNav } from "@/components/Nav/TopNav";
import { BottomNav } from "@/components/Nav/BottomNav";
import {
  DEFAULT_TAG_FILTER,
  type PhotoTagFilter,
  readStoredTagFilter,
  writeStoredTagFilter,
} from "@/lib/photoTag";
import {
  DEFAULT_PERIOD,
  type PeriodKey,
  readStoredPeriod,
  writeStoredPeriod,
} from "@/lib/spotPeriod";
import { readHomeMapView } from "@/lib/homeMapView";

const MapViewClient = dynamic(() => import("@/components/Map/MapViewClient"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-surface-container-highest" />,
});

export function HomePageClient() {
  const [bootView] = useState(() => readHomeMapView());
  const [zoom, setZoom] = useState(bootView?.zoom ?? 11);
  const [locateSignal, setLocateSignal] = useState(0);
  const [initialCenter, setInitialCenter] = useState<{ lat: number; lng: number } | null>(
    bootView ? { lat: bootView.lat, lng: bootView.lng } : null,
  );
  const [recenterSignal, setRecenterSignal] = useState(bootView ? 1 : 0);
  const [period, setPeriod] = useState<PeriodKey>(DEFAULT_PERIOD);
  const [tagFilter, setTagFilter] = useState<PhotoTagFilter>(DEFAULT_TAG_FILTER);
  const [customTags, setCustomTags] = useState<Array<{ id: string; tag: string }>>([]);

  // マウント後に localStorage から復元（SSR ハイドレーション不整合を避けるため初期値はデフォルト固定）
  useEffect(() => {
    const t = window.setTimeout(() => {
      const storedPeriod = readStoredPeriod();
      if (storedPeriod) setPeriod(storedPeriod);
      const storedTag = readStoredTagFilter();
      if (storedTag) setTagFilter(storedTag);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  // ユーザーのカスタムタグを取得
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/me/tags", { cache: "no-store" });
        if (!res.ok) return;
        const d = (await res.json()) as { tags?: Array<{ id: string; tag: string }> };
        if (!cancelled) setCustomTags(d.tags ?? []);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePeriodChange = (next: PeriodKey) => {
    setPeriod(next);
    writeStoredPeriod(next);
  };

  const handleTagFilterChange = (next: PhotoTagFilter) => {
    setTagFilter(next);
    writeStoredTagFilter(next);
  };

  useEffect(() => {
    if (bootView) return;

    let cancelled = false;

    const finish = (center: { lat: number; lng: number } | null) => {
      if (cancelled || !center) return;
      setInitialCenter(center);
      setZoom(14);
      setRecenterSignal((v) => v + 1);
    };

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => finish({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        async () => {
          try {
            const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
            if (!res.ok) return;
            const d = (await res.json()) as { latitude?: number; longitude?: number };
            const lat = d.latitude;
            const lng = d.longitude;
            if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
              finish({ lat, lng });
            }
          } catch {
            // ignore
          }
        },
        { enableHighAccuracy: true, timeout: 1800, maximumAge: 60_000 },
      );
    } else {
      void (async () => {
        try {
          const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
          if (!res.ok) return;
          const d = (await res.json()) as { latitude?: number; longitude?: number };
          const lat = d.latitude;
          const lng = d.longitude;
          if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
            finish({ lat, lng });
          }
        } catch {
          // ignore
        }
      })();
    }

    return () => {
      cancelled = true;
    };
  }, [bootView]);

  return (
    <div className="relative h-svh w-full overflow-hidden text-[#111827] scheme-light">
      <TopNav
        filters={{
          period,
          onPeriodChange: handlePeriodChange,
          tagFilter,
          onTagFilterChange: handleTagFilterChange,
          customTags,
        }}
      />

      <main className="relative h-svh w-full">
        <div className="home-map-viewport">
          <MapViewClient
            showInternalControls={false}
            locateSignal={locateSignal}
            initialCenter={initialCenter}
            initialZoom={zoom}
            recenterSignal={recenterSignal}
            period={period}
            tagFilter={tagFilter}
            mapWrapClassName="home-map-wrap"
          />
        </div>

        {/* Controls Bottom-Right */}
        <HomeBottomRightControls
          onLocate={() => setLocateSignal((v) => v + 1)}
        />
      </main>

      <BottomNav active="map" />
      <HomeBottomSheetIndicator />
    </div>
  );
}

