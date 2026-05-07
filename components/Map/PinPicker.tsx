"use client";

import dynamic from "next/dynamic";

const PinPickerClient = dynamic(() => import("./PinPickerClient"), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-lg bg-(--surface)/35" />,
});

export type PickedLocation = {
  lat: number;
  lng: number;
};

export function PinPicker(props: {
  value: PickedLocation | null;
  onChange: (value: PickedLocation) => void;
}) {
  return <PinPickerClient {...props} />;
}

