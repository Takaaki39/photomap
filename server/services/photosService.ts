import "server-only";

import { createSignedPhotoUrl } from "@/lib/photoUrl";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type { Database } from "@/types";

type MePhotoRow = {
  id: string;
  user_id: string;
  spot_id: string;
  storage_url: string;
  thumbnail_url: string | null;
  is_public: boolean;
  created_at: string;
  spots: { name: string } | null;
};

export type MyPhotoDto = {
  id: string;
  spot_id: string;
  spot_name: string;
  image_url: string | null;
  storage_url: string | null;
  storage_path: string;
  is_public: boolean;
  created_at: string;
};

export async function listMyPhotos(
  userId: string,
  filters: {
    q?: string;
    from?: string | null;
    to?: string | null;
    visibility?: string | null;
  },
): Promise<MyPhotoDto[]> {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("photos")
    .select("id, user_id, spot_id, storage_url, thumbnail_url, is_public, created_at, spots(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filters.visibility === "public") query = query.eq("is_public", true);
  if (filters.visibility === "private") query = query.eq("is_public", false);
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59.999Z`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as MePhotoRow[];
  let photos = await Promise.all(
    rows.map(async (row) => {
      const signedThumb = await createSignedPhotoUrl(row.thumbnail_url, 3600);
      const signedOriginal = await createSignedPhotoUrl(row.storage_url, 3600);
      return {
        id: row.id,
        spot_id: row.spot_id,
        spot_name: row.spots?.name ?? "",
        image_url: signedThumb ?? signedOriginal,
        storage_url: signedOriginal,
        storage_path: row.storage_url,
        is_public: row.is_public,
        created_at: row.created_at,
      };
    }),
  );

  const q = (filters.q ?? "").trim();
  if (q) {
    const lower = q.toLowerCase();
    photos = photos.filter((p) => p.spot_name.toLowerCase().includes(lower));
  }

  return photos;
}

type PhotoOwnerRow = Pick<Database["public"]["Tables"]["photos"]["Row"], "id" | "user_id">;
type PhotoDeleteRow = Pick<
  Database["public"]["Tables"]["photos"]["Row"],
  "id" | "user_id" | "storage_url" | "thumbnail_url" | "spot_id"
>;

export async function updatePhotoVisibility(
  userId: string,
  photoId: string,
  isPublic: boolean,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const admin = createSupabaseAdminClient();
  const { data: row, error: rowError } = await admin
    .from("photos")
    .select("id, user_id")
    .eq("id", photoId)
    .maybeSingle();
  if (rowError) return { ok: false, status: 500, error: rowError.message };
  if (!row) return { ok: false, status: 404, error: "not found" };
  const ownerRow = row as PhotoOwnerRow;
  if (ownerRow.user_id !== userId) {
    return { ok: false, status: 403, error: "forbidden" };
  }

  const { error } = await admin
    .from("photos")
    .update({ is_public: isPublic } as unknown as never)
    .eq("id", photoId);
  if (error) return { ok: false, status: 500, error: error.message };
  return { ok: true };
}

export async function deletePhotoForUser(
  userId: string,
  photoId: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const admin = createSupabaseAdminClient();

  const { data: row, error: rowError } = await admin
    .from("photos")
    .select("id, user_id, storage_url, thumbnail_url, spot_id")
    .eq("id", photoId)
    .maybeSingle();
  if (rowError) return { ok: false, status: 500, error: rowError.message };
  if (!row) return { ok: false, status: 404, error: "not found" };
  const deleteRow = row as PhotoDeleteRow;
  if (deleteRow.user_id !== userId) {
    return { ok: false, status: 403, error: "forbidden" };
  }

  const paths = [deleteRow.storage_url, deleteRow.thumbnail_url].filter((v): v is string =>
    Boolean(v),
  );
  if (paths.length > 0) {
    await admin.storage.from("photos").remove(paths);
  }

  const { error } = await admin.from("photos").delete().eq("id", photoId);
  if (error) return { ok: false, status: 500, error: error.message };

  if (deleteRow.spot_id) {
    const { count, error: countError } = await admin
      .from("photos")
      .select("id", { count: "exact", head: true })
      .eq("spot_id", deleteRow.spot_id);
    if (!countError && (count ?? 0) === 0) {
      await admin.from("spots").delete().eq("id", deleteRow.spot_id);
    }
  }

  return { ok: true };
}
