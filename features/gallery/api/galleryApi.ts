import { apiFetchSafe } from "@/shared/api/http";
import { deletePhoto as deletePhotoById } from "@/features/profile/api/photosApi";
import type { GalleryPhoto, GallerySpot, SpotDetail, SpotPhoto } from "../types";

export { deletePhotoById as deleteGalleryPhoto };

export async function fetchSpot(spotId: string): Promise<GallerySpot | null> {
  const result = await apiFetchSafe<{ spot?: GallerySpot }>(`/api/spots/${spotId}`, {
    cache: "no-store",
  });
  if (!result.ok) return null;
  return result.data.spot ?? null;
}

export async function fetchSpotDetail(spotId: string): Promise<SpotDetail | null> {
  const result = await apiFetchSafe<{ spot?: SpotDetail }>(`/api/spots/${spotId}`, {
    cache: "no-store",
  });
  if (!result.ok) return null;
  return result.data.spot ?? null;
}

export async function fetchSpotPhotos(
  spotId: string,
  limit = 100,
): Promise<{ photos: GalleryPhoto[]; total: number | null } | { error: string }> {
  const result = await apiFetchSafe<{ photos?: GalleryPhoto[]; total?: number | null }>(
    `/api/spots/${spotId}/photos?limit=${limit}`,
    { cache: "no-store" },
  );
  if (!result.ok) return { error: result.error };
  return {
    photos: result.data.photos ?? [],
    total: typeof result.data.total === "number" ? result.data.total : null,
  };
}

export async function fetchSpotPhotosAll(spotId: string): Promise<SpotPhoto[]> {
  const result = await apiFetchSafe<{ photos?: SpotPhoto[] }>(`/api/spots/${spotId}/photos`, {
    cache: "no-store",
  });
  if (!result.ok) return [];
  return result.data.photos ?? [];
}

export async function fetchPhotosInBounds(
  bounds: string,
  limit = 100,
): Promise<{ photos: GalleryPhoto[]; total: number | null } | { error: string }> {
  const result = await apiFetchSafe<{ photos?: GalleryPhoto[]; total?: number | null }>(
    `/api/photos/in-bounds?bounds=${encodeURIComponent(bounds)}&limit=${limit}`,
    { cache: "no-store" },
  );
  if (!result.ok) return { error: result.error };
  return {
    photos: result.data.photos ?? [],
    total: typeof result.data.total === "number" ? result.data.total : null,
  };
}

export async function fetchPhotosBySpots(
  spotIds: string[],
): Promise<{ photos: GalleryPhoto[]; total: number | null } | { error: string }> {
  if (spotIds.length === 0) return { photos: [], total: 0 };
  const result = await apiFetchSafe<{ photos?: GalleryPhoto[]; total?: number }>(
    `/api/photos/by-spots?ids=${encodeURIComponent(spotIds.join(","))}`,
    { cache: "no-store" },
  );
  if (!result.ok) return { error: result.error };
  return {
    photos: result.data.photos ?? [],
    total: typeof result.data.total === "number" ? result.data.total : null,
  };
}

export async function fetchSpotGallery(spotId: string): Promise<{
  spot: GallerySpot | null;
  photos: GalleryPhoto[];
  total: number | null;
} | { error: string }> {
  const [spot, photosResult] = await Promise.all([
    fetchSpot(spotId),
    fetchSpotPhotos(spotId),
  ]);
  if ("error" in photosResult) return { error: photosResult.error };
  return { spot, photos: photosResult.photos, total: photosResult.total };
}
