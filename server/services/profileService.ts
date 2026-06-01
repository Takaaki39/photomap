import "server-only";

import { createSignedPhotoUrl } from "@/lib/photoUrl";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type { Database } from "@/types";

const BIO_MAX = 200;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

export type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  primary_location: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type MeProfileDto = {
  display_name: string;
  username: string | null;
  bio: string | null;
  primary_location: string | null;
  avatar_url: string | null;
  email: string | null;
  member_since: string | null;
};

const USER_SELECT =
  "id, email, display_name, username, bio, primary_location, avatar_url, created_at";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function normalizeUsername(raw: string) {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

export async function findUserRow(session: {
  user: { id?: string; email?: string | null; name?: string | null; image?: string | null };
}): Promise<UserRow | null> {
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

export async function getProfileForSession(session: {
  user: { id?: string; email?: string | null; name?: string | null; image?: string | null };
}): Promise<MeProfileDto> {
  const row = await findUserRow(session);
  const displayName =
    row?.display_name?.trim() || session.user.name?.trim() || "ユーザー";
  const avatarRaw = row?.avatar_url ?? session.user.image ?? null;
  const avatarUrl = avatarRaw ? await createSignedPhotoUrl(avatarRaw, 3600) : null;

  return {
    display_name: displayName,
    username: row?.username ?? null,
    bio: row?.bio ?? null,
    primary_location: row?.primary_location ?? null,
    avatar_url: avatarUrl ?? (avatarRaw?.startsWith("http") ? avatarRaw : null),
    email: row?.email ?? session.user.email ?? null,
    member_since: row?.created_at ?? null,
  };
}

export type UpdateProfileInput = {
  displayName: string;
  usernameRaw: string;
  bio: string;
  primaryLocation: string;
  icon: File | null;
  hasUsernameField: boolean;
  hasBioField: boolean;
  hasPrimaryLocationField: boolean;
};

export type UpdateProfileResult =
  | {
      ok: true;
      avatar_url?: string | null;
      display_name?: string;
      username?: string | null;
      bio?: string | null;
      primary_location?: string | null;
    }
  | { ok: false; status: number; error: string };

export async function updateProfileForUser(
  session: { user: { id?: string } },
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  const admin = createSupabaseAdminClient();
  const row = await findUserRow(session);
  const userId = row?.id ?? (session.user.id && isUuid(session.user.id) ? session.user.id : null);
  if (!userId) {
    return { ok: false, status: 404, error: "user not found" };
  }

  let username: string | null | undefined;
  if (input.usernameRaw) {
    const normalized = normalizeUsername(input.usernameRaw);
    if (!USERNAME_RE.test(normalized)) {
      return {
        ok: false,
        status: 400,
        error: "ユーザー名は3〜30文字の英数字とアンダースコアのみ使えます。",
      };
    }
    const { data: taken } = await admin
      .from("users")
      .select("id")
      .ilike("username", normalized)
      .neq("id", userId)
      .maybeSingle();
    if (taken) {
      return { ok: false, status: 409, error: "このユーザー名は既に使われています。" };
    }
    username = normalized;
  } else if (input.hasUsernameField) {
    username = null;
  }

  let avatarUrl: string | null | undefined;
  if (input.icon && input.icon.size > 0) {
    const path = `avatars/${userId}/${crypto.randomUUID()}-${input.icon.name.replace(/[^\w.-]/g, "_")}`;
    const { error: uploadError } = await admin.storage
      .from("photos")
      .upload(path, new Uint8Array(await input.icon.arrayBuffer()), {
        contentType: input.icon.type || "application/octet-stream",
        upsert: false,
      });
    if (uploadError) {
      return { ok: false, status: 500, error: uploadError.message };
    }
    avatarUrl = path;
  }

  const updatePayload: Database["public"]["Tables"]["users"]["Update"] = {
    ...(input.displayName ? { display_name: input.displayName } : {}),
    ...(username !== undefined ? { username } : {}),
    ...(input.hasBioField ? { bio: input.bio || null } : {}),
    ...(input.hasPrimaryLocationField
      ? { primary_location: input.primaryLocation || null }
      : {}),
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
  };

  const { error } = await admin
    .from("users")
    .update(updatePayload as unknown as never)
    .eq("id", userId);

  if (error) return { ok: false, status: 500, error: error.message };

  const signedAvatar =
    avatarUrl != null ? await createSignedPhotoUrl(avatarUrl, 3600) : undefined;

  return {
    ok: true,
    avatar_url: signedAvatar ?? avatarUrl ?? null,
    display_name: input.displayName || undefined,
    username: username ?? undefined,
    bio: input.bio || null,
    primary_location: input.primaryLocation || null,
  };
}

export { BIO_MAX, USERNAME_RE };
