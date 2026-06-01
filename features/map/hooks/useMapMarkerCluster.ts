"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import { getMapPinDivIcon, setMarkerOverlayIcon, type MapPinOverlayKey } from "@/lib/mapPinIcon";
import type { SpotMapItem } from "@/features/map/store/spotsBoundsCache";
import { INITIAL_ZOOM } from "../constants";
import type { MapViewCoords } from "../types";

export function useMapMarkerCluster(options: {
  pinOverlay: MapPinOverlayKey;
  persistView: (view: MapViewCoords) => void;
  debug: boolean;
}) {
  const { pinOverlay, persistView, debug } = options;
  const router = useRouter();
  const mapRef = useRef<LeafletMap | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markerByIdRef = useRef<Map<string, L.Marker>>(new Map());
  const pinOverlayRef = useRef<MapPinOverlayKey>("default");

  const updateMarkers = useCallback(
    (nextSpots: SpotMapItem[]) => {
      const cluster = clusterRef.current;
      if (!cluster) return;

      const prev = markerByIdRef.current;
      const next = new Map<string, L.Marker>();
      const toAdd: L.Marker[] = [];
      const toRemove: L.Marker[] = [];
      const icon = getMapPinDivIcon(pinOverlay);
      const overlayChanged = pinOverlayRef.current !== pinOverlay;
      if (overlayChanged) pinOverlayRef.current = pinOverlay;

      for (const spot of nextSpots) {
        const existing = prev.get(spot.id);
        if (existing) {
          const ll = existing.getLatLng();
          if (ll.lat !== spot.lat || ll.lng !== spot.lng) {
            existing.setLatLng([spot.lat, spot.lng]);
          }
          if (overlayChanged) setMarkerOverlayIcon(existing, pinOverlay);
          next.set(spot.id, existing);
          continue;
        }
        const marker = L.marker([spot.lat, spot.lng], { icon });
        (marker.options as Record<string, string>).spotId = spot.id;
        marker.on("click", () => {
          try {
            const z = mapRef.current?.getZoom() ?? INITIAL_ZOOM;
            persistView({ lat: spot.lat, lng: spot.lng, zoom: z });
          } catch {
            // ignore
          }
          router.push(`/gallery/${spot.id}`);
        });
        next.set(spot.id, marker);
        toAdd.push(marker);
      }

      for (const [id, marker] of prev) {
        if (!next.has(id)) toRemove.push(marker);
      }

      if (toRemove.length > 0) cluster.removeLayers(toRemove);
      if (toAdd.length > 0) cluster.addLayers(toAdd);
      if (toRemove.length > 0 || toAdd.length > 0) cluster.refreshClusters();
      markerByIdRef.current = next;
    },
    [pinOverlay, persistView, router],
  );

  const setupClusterOnMap = useCallback(
    (map: LeafletMap) => {
      if (clusterRef.current) return;
      mapRef.current = map;
      if (debug) console.log("[map] ready");

      const markerClusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: false,
        removeOutsideVisibleBounds: false,
        maxClusterRadius: 42,
        spiderfyOnMaxZoom: false,
      });

      markerClusterGroup.on("clusterclick", (e) => {
        const cluster = e.layer as L.MarkerCluster;
        const children = cluster.getAllChildMarkers?.() ?? [];
        const ids = [
          ...new Set(
            children
              .map((m) => (m.options as { spotId?: string }).spotId)
              .filter((id): id is string => Boolean(id)),
          ),
        ];

        const persistClusterCenter = () => {
          try {
            const center = cluster.getLatLng();
            const z = mapRef.current?.getZoom() ?? INITIAL_ZOOM;
            persistView({ lat: center.lat, lng: center.lng, zoom: z });
          } catch {
            // ignore
          }
        };

        if (ids.length >= 2) {
          persistClusterCenter();
          const galleryId = `cluster:spots~${ids.join("~")}`;
          router.push(`/gallery/${encodeURIComponent(galleryId)}`);
          return;
        }
        if (ids.length === 1) {
          persistClusterCenter();
          router.push(`/gallery/${ids[0]}`);
          return;
        }
        cluster.zoomToBounds?.();
      });

      clusterRef.current = markerClusterGroup;
      map.addLayer(markerClusterGroup);
    },
    [debug, persistView, router],
  );

  useEffect(() => {
    return () => {
      if (clusterRef.current && mapRef.current) {
        mapRef.current.removeLayer(clusterRef.current);
      }
      clusterRef.current = null;
    };
  }, []);

  return { mapRef, setupClusterOnMap, updateMarkers };
}
