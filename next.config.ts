import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isProd = process.env.NODE_ENV === "production";

const internalHost = process.env.TAURI_DEV_HOST || "localhost";

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./i18n/request.ts",
  experimental: {
    createMessagesDeclaration: "./messages/en.json",
  },
});

// For desktop we still run a Node.js-powered Next server (no static export),
// but we avoid Next's standalone symlink output on Windows by packaging the
// regular .next build and a small Node launcher instead (see scripts/tauri-build.js).
const nextConfig: NextConfig = {
  // output: "standalone", // disabled to avoid Windows symlink (EPERM) during build
  // Note: This feature is required to use the Next.js Image component in SSG mode.
  // See https://nextjs.org/docs/messages/export-image-api for different workarounds.
  images: {
    unoptimized: true,
  },
  // Configure assetPrefix or else the server won't properly resolve your assets in dev.
  assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
};

export default withNextIntl(nextConfig);
