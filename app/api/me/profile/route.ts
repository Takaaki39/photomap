import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { createSignedPhotoUrl } from "@/lib/photoUrl";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type { Database } from "@/types";

const BIO_MAX = 200;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  primary_location: string | null;
  avatar_url: string | null;
  created_at: string;
};

const USER_SELECT =
  "id, email, display_name, username, bio, primary_location, avatar_url, created_at";

async function findUserRow(session: {
  user: { id?: string; email?: string | null; name?: string | null; image?: string | null };
}) {
  const admin = createSupabaseAdminClient();
  const email = session.user.email?.trim();
  if (email) {
    const { data } = await admin
      .from("users")
      .select(USER_SELECT)
      .eq("email", email)
      .maybeSingle();
    if (data) return data as UserRow;
  }

  const id = session.user.id;
  if (id && isUuid(id)) {
    const { data } = await admin
      .from("users")
      .select(USER_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (data) return data as UserRow;
  }

  return null;
}

function normalizeUsername(raw: string) {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const row = await findUserRow(session);
  const displayName =
    row?.display_name?.trim() || session.user.name?.trim() || "ユーザー";
  const avatarRaw = row?.avatar_url ?? session.user.image ?? null;
  const avatarUrl = avatarRaw ? await createSignedPhotoUrl(avatarRaw, 3600) : null;

  return NextResponse.json({
    profile: {
      display_name: displayName,
      username: row?.username ?? null,
      bio: row?.bio ?? null,
      primary_location: row?.primary_location ?? null,
      avatar_url: avatarUrl ?? (avatarRaw?.startsWith("http") ? avatarRaw : null),
      email: row?.email ?? session.user.email ?? null,
      member_since: row?.created_at ?? null,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const usernameRaw = String(formData.get("username") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim().slice(0, BIO_MAX);
  const primaryLocation = String(formData.get("primary_location") ?? "").trim();
  const icon = formData.get("icon");
  const admin = createSupabaseAdminClient();

  const row = await findUserRow(session);
  const userId = row?.id ?? (isUuid(session.user.id) ? session.user.id : null);
  if (!userId) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  let username: string | null | undefined;
  if (usernameRaw) {
    const normalized = normalizeUsername(usernameRaw);
    if (!USERNAME_RE.test(normalized)) {
      return NextResponse.json(
        { error: "ユーザー名は3〜30文字の英数字とアンダースコアのみ使えます。" },
        { status: 400 },
      );
    }
    const { data: taken } = await admin
      .from("users")
      .select("id")
      .ilike("username", normalized)
      .neq("id", userId)
      .maybeSingle();
    if (taken) {
      return NextResponse.json({ error: "このユーザー名は既に使われています。" }, { status: 409 });
    }
    username = normalized;
  } else if (formData.has("username")) {
    username = null;
  }

  let avatarUrl: string | null | undefined;
  if (icon instanceof File && icon.size > 0) {
    const path = `avatars/${userId}/${crypto.randomUUID()}-${icon.name.replace(/[^\w.-]/g, "_")}`;
    const { error: uploadError } = await admin.storage
      .from("photos")
      .upload(path, new Uint8Array(await icon.arrayBuffer()), {
        contentType: icon.type || "application/octet-stream",
        upsert: false,
      });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });
    avatarUrl = path;
  }

  const updatePayload: Database["public"]["Tables"]["users"]["Update"] = {
    ...(displayName ? { display_name: displayName } : {}),
    ...(username !== undefined ? { username } : {}),
    ...(formData.has("bio") ? { bio: bio || null } : {}),
    ...(formData.has("primary_location")
      ? { primary_location: primaryLocation || null }
      : {}),
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
  };

  const { error } = await admin
    .from("users")
    .update(updatePayload as unknown as never)
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const signedAvatar =
    avatarUrl != null ? await createSignedPhotoUrl(avatarUrl, 3600) : undefined;

  return NextResponse.json({
    ok: true,
    avatar_url: signedAvatar ?? avatarUrl ?? null,
    display_name: displayName || undefined,
    username: username ?? undefined,
    bio: bio || null,
    primary_location: primaryLocation || null,
  });
}
