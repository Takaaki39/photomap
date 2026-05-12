import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline",
  },
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
