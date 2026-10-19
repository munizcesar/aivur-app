import type { NextConfig } from "next";

if (process.env.NODE_ENV === 'development') {
  const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev');
  const persistPath = process.env.MINIFLARE_PERSIST_PATH?.trim();
  console.log('[next.config.ts] MINIFLARE_PERSIST_PATH:', persistPath || '(default)');
  setupDevPlatform({
    configPath: 'wrangler.local.toml',
    persist: persistPath
      ? { path: persistPath.endsWith('v3') ? persistPath : `${persistPath}/v3` }
      : undefined,
  });
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
