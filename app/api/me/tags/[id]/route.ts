import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { deleteUserTag } from "@/server/services/tagsService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function DELETE(_: Request, context: RouteContext) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "invalid tag id" }, { status: 400 });
  }

  const result = await deleteUserTag(session.user.id, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
