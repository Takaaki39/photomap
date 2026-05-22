import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf-8");
for (const line of envText.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  const [, k, raw] = m;
  if (process.env[k]) continue;
  process.env[k] = raw.replace(/^"(.*)"$/, "$1");
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const storageNames: string[] = [];
  async function walk(prefix: string) {
    const { data, error } = await admin.storage
      .from("photos")
      .list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    for (const entry of data ?? []) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        await walk(path);
      } else {
        storageNames.push(path);
      }
    }
  }
  await walk("");
  const objects = storageNames.map((name) => ({ name }));

  const { data: photos, error: photosErr } = await admin
    .from("photos")
    .select("storage_url, thumbnail_url");
  if (photosErr) throw photosErr;

  const referenced = new Set<string>();
  for (const p of photos ?? []) {
    if (p.storage_url) referenced.add(p.storage_url);
    if (p.thumbnail_url) referenced.add(p.thumbnail_url);
  }

  const orphans = (objects ?? [])
    .map((o) => o.name as string)
    .filter((name) => !referenced.has(name));

  console.log(`storage objects: ${objects?.length ?? 0}`);
  console.log(`referenced: ${referenced.size}`);
  console.log(`orphans: ${orphans.length}`);
  for (const n of orphans) console.log(" -", n);

  if (orphans.length === 0) {
    console.log("nothing to delete");
    return;
  }

  const { data: removed, error: rmErr } = await admin.storage
    .from("photos")
    .remove(orphans);
  if (rmErr) throw rmErr;
  console.log(`deleted: ${removed?.length ?? 0}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
