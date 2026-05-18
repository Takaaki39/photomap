"use client";

import { useEffect, useMemo, useState } from "react";
import type { GalleryPhoto } from "./types";

export function useGalleryFirstImageReady(photos: GalleryPhoto[], photosLoading: boolean) {
  const firstImageUrl = useMemo(
    () => photos.find((p) => p.image_url)?.image_url ?? null,
    [photos],
  );
  const [firstImageReady, setFirstImageReady] = useState(false);

  useEffect(() => {
    if (photosLoading) {
      setFirstImageReady(false);
      return;
    }
    if (!firstImageUrl) {
      setFirstImageReady(true);
      return;
    }

    setFirstImageReady(false);
    const img = new Image();
    let cancelled = false;
    img.onload = () => {
      if (!cancelled) setFirstImageReady(true);
    };
    img.onerror = () => {
      if (!cancelled) setFirstImageReady(true);
    };
    img.src = firstImageUrl;
    return () => {
      cancelled = true;
    };
  }, [firstImageUrl, photosLoading]);

  const showGalleryLoading =
    photosLoading || (photos.length > 0 && Boolean(firstImageUrl) && !firstImageReady);

  return { showGalleryLoading, firstImageReady };
}
