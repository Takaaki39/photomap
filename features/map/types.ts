export type DisplayMode =
  | "world"
  | "country"
  | "region"
  | "prefecture"
  | "city"
  | "spot"
  | "detail";

export type MapViewHandle = {
  setZoom: (zoom: number) => void;
  locate: () => void;
};

export type MapFocusParams = {
  spotId: string | null;
  lat: number | null;
  lng: number | null;
  zoom: number | null;
};

export type MapViewCoords = { lat: number; lng: number; zoom: number };
