import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/geocode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "invalid lat/lng" }, { status: 400 });
  }

  const r = await reverseGeocode(lat, lng);
  return NextResponse.json({ result: r });
}

