import { notFound } from "next/navigation";
import { GalleryClient } from "@/components/Gallery/GalleryClient";
import { ClusterGalleryClient } from "@/components/Gallery/ClusterGalleryClient";
import { MergedSpotsGalleryClient } from "@/components/Gallery/MergedSpotsGalleryClient";
import { isMergedSpotsClusterGalleryId, normalizeGalleryRouteId } from "@/lib/galleryRouteId";

type GalleryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { id: rawId } = await params;
  if (!rawId) notFound();
  const id = normalizeGalleryRouteId(rawId);
  if (isMergedSpotsClusterGalleryId(id)) {
    return <MergedSpotsGalleryClient clusterId={id} />;
  }
  if (id.startsWith("cluster:")) {
    return <ClusterGalleryClient clusterId={id} />;
  }
  return <GalleryClient spotId={id} />;
}

