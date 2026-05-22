declare module "next-pwa" {
  import type { NextConfig } from "next";

  type PWAOptions = {
    dest: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    fallbacks?: {
      document?: string;
      image?: string;
      audio?: string;
      video?: string;
      font?: string;
    };
    [key: string]: unknown;
  };

  export default function withPWA(options: PWAOptions): (config: NextConfig) => NextConfig;
}

declare module "next-pwa/cache" {
  // workbox の RuntimeCaching 設定はノードコンフィグ側でしか使わないので unknown で十分。
  const cache: ReadonlyArray<unknown>;
  export default cache;
}
