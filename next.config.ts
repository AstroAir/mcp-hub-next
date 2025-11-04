import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const internalHost = process.env.TAURI_DEV_HOST || "localhost";

// NOTE: Static export is disabled because this app uses API routes extensively.
// For Tauri desktop app, we need to either:
// 1. Run Next.js in server mode alongside Tauri (requires bundling Node.js)
// 2. Migrate all API route logic to Tauri Rust commands (major refactoring)
// Currently using approach #1 for development.
const nextConfig: NextConfig = {
  // Enable static export only when explicitly requested (e.g. Tauri prod builds)
  ...(process.env.TAURI_STATIC_EXPORT === 'true' ? { output: 'export' as const } : {}),
  // Note: This feature is required to use the Next.js Image component in SSG mode.
  // See https://nextjs.org/docs/messages/export-image-api for different workarounds.
  images: {
    unoptimized: true,
  },
  // Configure assetPrefix or else the server won't properly resolve your assets.
  assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
};

export default nextConfig;
