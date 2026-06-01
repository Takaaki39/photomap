import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import {
  getProfileForSession,
  updateProfileForUser,
  BIO_MAX,
} from "@/server/services/profileService";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await getProfileForSession(session);
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const icon = formData.get("icon");

  const result = await updateProfileForUser(session, {
    displayName: String(formData.get("display_name") ?? "").trim(),
    usernameRaw: String(formData.get("username") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim().slice(0, BIO_MAX),
    primaryLocation: String(formData.get("primary_location") ?? "").trim(),
    icon: icon instanceof File && icon.size > 0 ? icon : null,
    hasUsernameField: formData.has("username"),
    hasBioField: formData.has("bio"),
    hasPrimaryLocationField: formData.has("primary_location"),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    avatar_url: result.avatar_url,
    display_name: result.display_name,
    username: result.username,
    bio: result.bio,
    primary_location: result.primary_location,
  });
}
