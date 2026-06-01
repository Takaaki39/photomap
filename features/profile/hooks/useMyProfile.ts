import { useCallback, useEffect, useState } from "react";
import { fetchMyProfile } from "../api/profileApi";
import type { MeProfile } from "../types";

export function useMyProfile() {
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await fetchMyProfile();
      setProfile(p);
      if (!p) setError("プロフィールの読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { profile, loading, error, reload, setProfile };
}
