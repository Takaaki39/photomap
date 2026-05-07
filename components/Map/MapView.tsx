"use client";

import dynamic from "next/dynamic";

const MapViewClient = dynamic(() => import("./MapViewClient"), {
  ssr: false,
  loading: () => <div className="h-[70vh] w-full animate-pulse rounded-lg bg-(--surface)/35" />,
});

export function MapView() {
  return <MapViewClient />;
}
