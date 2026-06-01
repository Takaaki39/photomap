import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { deletePhotoForUser, updatePhotoVisibility } from "@/server/services/photosService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { is_public } = (await request.json()) as { is_public?: boolean };
  if (typeof is_public !== "boolean") {
    return NextResponse.json({ error: "is_public must be boolean" }, { status: 400 });
  }

  const result = await updatePhotoVisibility(session.user.id, id, is_public);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, context: RouteContext) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await deletePhotoForUser(session.user.id, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
