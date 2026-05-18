/** ギャラリー表示用: 撮影日（taken_at）を優先し、無ければ投稿日（created_at） */
export function formatGalleryPhotoDate(photo: {
  taken_at?: string | null;
  created_at: string;
}): string {
  const raw = photo.taken_at?.trim() || photo.created_at;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ja-JP");
}
