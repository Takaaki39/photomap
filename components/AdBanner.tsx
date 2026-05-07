"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdBanner() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID;
  const isDev = process.env.NODE_ENV !== "production";

  useEffect(() => {
    if (isDev || !clientId || !slotId) return;
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
  }, [clientId, isDev, slotId]);

  if (isDev || !clientId || !slotId) {
    return (
      <div className="rounded-md border border-dashed border-outline-variant p-4 text-center text-xs text-outline">
        Ad Placeholder (development)
      </div>
    );
  }

  return (
    <>
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </>
  );
}
