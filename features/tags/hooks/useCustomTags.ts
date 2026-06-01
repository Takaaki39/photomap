import { useCallback, useEffect, useState } from "react";
import { createCustomTag, deleteCustomTag, fetchCustomTags } from "../api/tagsApi";
import type { CustomTag } from "../types";

export function useCustomTags() {
  const [tags, setTags] = useState<CustomTag[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const list = await fetchCustomTags();
      setTags(list);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addTag = useCallback(async (tag: string) => {
    setError(null);
    const result = await createCustomTag(tag);
    if (!result.ok) {
      setError(result.error);
      return null;
    }
    setTags((prev) => [...prev, result.tag]);
    return result.tag;
  }, []);

  const removeTag = useCallback(async (target: CustomTag) => {
    if (!confirm(`タグ「${target.tag}」を削除します。\nこのタグを付けた写真自体は残ります。`)) {
      return false;
    }
    const result = await deleteCustomTag(target.id);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setTags((prev) => prev.filter((c) => c.id !== target.id));
    return true;
  }, []);

  return { tags, loaded, error, setError, reload, addTag, removeTag };
}
