import type { PickedLocation } from "@/components/Map/PinPicker";

export type UploadStage = "select" | "review" | "uploading" | "done";

export type UploadGps = { lat: number; lng: number } | null;

export type UploadResult = { spot_id: string; photo_id: string; lat?: number; lng?: number } | null;

export type UploadChosenLocation = { lat: number; lng: number } | PickedLocation | null;

