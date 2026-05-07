import { notFound } from "next/navigation";
import { GalleryClient } from "@/components/Gallery/GalleryClient";
import { ClusterGalleryClient } from "@/components/Gallery/ClusterGalleryClient";

type GalleryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { id } = await params;
  if (!id) notFound();
  if (id.startsWith("cluster:")) {
    return <ClusterGalleryClient clusterId={id} />;
  }
  return <GalleryClient spotId={id} />;
}

