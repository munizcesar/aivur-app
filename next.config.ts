import type { NextConfig } from "next";

if (process.env.NODE_ENV === 'development') {
  const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev');
  setupDevPlatform({ configPath: 'wrangler.local.toml' });
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
