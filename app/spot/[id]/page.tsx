import { notFound } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { SpotDetailClient } from "@/components/Spot/SpotDetailClient";

type SpotPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SpotPage({ params }: SpotPageProps) {
  const { id } = await params;
  if (!id) notFound();
  const session = await getServerAuthSession();

  return <SpotDetailClient spotId={id} currentUserId={session?.user?.id} />;
}
