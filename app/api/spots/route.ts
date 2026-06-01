import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { listSpotsInBounds, parseBounds } from "@/server/services/spotsService";

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bounds = parseBounds(searchParams.get("bounds"));
  const zoom = Number(searchParams.get("zoom") ?? 5);
  if (!bounds) {
    return NextResponse.json(
      { error: "invalid bounds. expected north,south,east,west" },
      { status: 400 },
    );
  }

  try {
    const result = await listSpotsInBounds(bounds, zoom);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
