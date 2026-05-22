import type { NextConfig } from "next";
import withPWAInit from "next-pwa";
// next-pwa の既定キャッシュ。これに地図タイル用のルールを先頭追加する。
import defaultRuntimeCaching from "next-pwa/cache";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline",
  },
  // OSM JP のタイルは CDN を持たないため、ServiceWorker で CacheFirst キャッシュして体感を改善する。
  // 既定のキャッシュは next-pwa/cache をそのまま流用する（順序は workbox の先頭優先一致なので、
  // タイル用のルールを先頭に置く）。
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.jp\/.*\.png$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "osm-jp-tiles",
        expiration: {
          maxEntries: 4000,
          // タイルは長期キャッシュ可（OSM 由来データの更新頻度は低い）
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    ...defaultRuntimeCaching,
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'self'",
      "img-src 'self' data: blob: https://*.supabase.co https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.jp https://*.openstreetmap.jp https://*.tile.openstreetmap.org https://*.openstreetmap.org https://*.googleusercontent.com https://*.gstatic.com https://*.googlesyndication.com",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagservices.com https://tpc.googlesyndication.com",
      "connect-src 'self' https://*.supabase.co https://raw.githubusercontent.com https://cdn.jsdelivr.net https://nominatim.openstreetmap.org https://*.openstreetmap.org https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net",
      "font-src 'self' data:",
      "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
