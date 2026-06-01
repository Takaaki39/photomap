"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { HomeBottomRightControls } from "@/components/Home/HomeBottomRightControls";
import { HomeBottomSheetIndicator } from "@/components/Home/HomeBottomSheetIndicator";
import { TopNav } from "@/components/Nav/TopNav";
import { BottomNav } from "@/components/Nav/BottomNav";
import { useInitialMapCenter } from "@/features/map/hooks/useInitialMapCenter";
import { useCustomTags } from "@/features/tags/hooks/useCustomTags";
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

const MapViewClient = dynamic(() => import("@/components/Map/MapViewClient"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-surface-container-highest" />,
});

export function HomePageClient() {
  const { initialCenter, zoom, recenterSignal } = useInitialMapCenter();
  const { tags: customTags } = useCustomTags();
  const [locateSignal, setLocateSignal] = useState(0);
  const [period, setPeriod] = useState<PeriodKey>(DEFAULT_PERIOD);
  const [tagFilter, setTagFilter] = useState<PhotoTagFilter>(DEFAULT_TAG_FILTER);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const storedPeriod = readStoredPeriod();
      if (storedPeriod) setPeriod(storedPeriod);
      const storedTag = readStoredTagFilter();
      if (storedTag) setTagFilter(storedTag);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const handlePeriodChange = (next: PeriodKey) => {
    setPeriod(next);
    writeStoredPeriod(next);
  };

  const handleTagFilterChange = (next: PhotoTagFilter) => {
    setTagFilter(next);
    writeStoredTagFilter(next);
  };

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

        <HomeBottomRightControls
          onLocate={() => setLocateSignal((v) => v + 1)}
        />
      </main>

      <BottomNav active="map" />
      <HomeBottomSheetIndicator />
    </div>
  );
}
