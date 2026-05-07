import type { Photo } from "@/types";

type PhotoCardProps = {
  photo: Photo;
};

export function PhotoCard({ photo }: PhotoCardProps) {
  return (
    <article className="rounded-lg border p-3">
      <p className="text-sm">Photo: {photo.id}</p>
    </article>
  );
}
