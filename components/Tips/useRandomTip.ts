"use client";

import { useEffect, useState } from "react";
import { pickRandomTip, TIP_FALLBACK } from "@/lib/tips";

export function useRandomTip(enabled: boolean) {
  const [tipText, setTipText] = useState(TIP_FALLBACK);

  useEffect(() => {
    if (!enabled) return;
    setTipText(pickRandomTip());
  }, [enabled]);

  return tipText;
}
