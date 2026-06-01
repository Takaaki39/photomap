import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { createUserTag, listUserTags } from "@/server/services/tagsService";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const tags = await listUserTags(session.user.id);
    return NextResponse.json({ tags });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { tag?: unknown };
  try {
    body = (await request.json()) as { tag?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const result = await createUserTag(session.user.id, body.tag);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ tag: result.tag });
}
