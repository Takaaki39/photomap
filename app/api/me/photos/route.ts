import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { listMyPhotos } from "@/server/services/photosService";

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  try {
    const photos = await listMyPhotos(session.user.id, {
      q: searchParams.get("q") ?? undefined,
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      visibility: searchParams.get("visibility"),
    });
    return NextResponse.json({ photos });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
