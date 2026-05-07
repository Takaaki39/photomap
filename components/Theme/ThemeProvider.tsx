"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "theme:preference";

function applyTheme(pref: ThemePreference) {
  const root = document.documentElement;
  root.dataset.theme = pref;

  const wantsDark =
    pref === "dark" ||
    (pref === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (wantsDark) root.classList.add("dark");
  else root.classList.remove("dark");
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

export function setStoredThemePreference(pref: ThemePreference) {
  window.localStorage.setItem(STORAGE_KEY, pref);
}

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const v = useContext(ThemeContext);
  if (!v) throw new Error("useTheme must be used within ThemeProvider");
  return v;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [pref, setPref] = useState<ThemePreference>(() => getStoredThemePreference());

  const media = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return null;
    return window.matchMedia("(prefers-color-scheme: dark)");
  }, []);

  useEffect(() => {
    applyTheme(pref);
  }, [pref]);

  useEffect(() => {
    // React to system theme changes when in "system"
    if (!media) return;
    const handler = () => {
      const current = getStoredThemePreference();
      if (current === "system") applyTheme("system");
    };
    media.addEventListener?.("change", handler);
    return () => media.removeEventListener?.("change", handler);
  }, [media]);

  useEffect(() => {
    // Keep DOM in sync if preference changes elsewhere
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = getStoredThemePreference();
      setPref(next);
      applyTheme(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setStoredThemePreference(next);
    setPref(next);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({ preference: pref, setPreference }), [pref, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

