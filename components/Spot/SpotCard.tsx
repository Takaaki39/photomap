import type { Spot } from "@/types";

type SpotCardProps = {
  spot: Spot;
};

export function SpotCard({ spot }: SpotCardProps) {
  return (
    <article className="rounded-lg border p-4">
      <h3 className="font-medium">{spot.name}</h3>
      <p className="text-sm text-on-surface-variant">{spot.address ?? "住所未設定"}</p>
    </article>
  );
}
