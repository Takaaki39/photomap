"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import type { PickedLocation } from "./PinPicker";

const DEFAULT_CENTER: [number, number] = [36.5, 136.0];
const DEFAULT_ZOOM = 6;

function ClickToPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

function MapInitializer({ onReady }: { onReady: (map: LeafletMap) => void }) {
  const map = useMapEvents({});
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

export default function PinPickerClient({
  value,
  onChange,
}: {
  value: PickedLocation | null;
  onChange: (value: PickedLocation) => void;
}) {
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (value) return [value.lat, value.lng];
    return DEFAULT_CENTER;
  }, [value]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (value) {
      if (!markerRef.current) {
        markerRef.current = L.marker([value.lat, value.lng], { draggable: true });
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current?.getLatLng();
          if (!pos) return;
          onChange({ lat: pos.lat, lng: pos.lng });
        });
        markerRef.current.addTo(map);
      } else {
        markerRef.current.setLatLng([value.lat, value.lng]);
      }
    }
  }, [value, onChange]);

  return (
    <MapContainer
      center={center}
      zoom={value ? 14 : DEFAULT_ZOOM}
      style={{ height: 320, width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapInitializer
        onReady={(map) => {
          mapRef.current = map;
        }}
      />
      <ClickToPick
        onPick={(lat, lng) => {
          onChange({ lat, lng });
          mapRef.current?.setView([lat, lng], 14);
        }}
      />
    </MapContainer>
  );
}

