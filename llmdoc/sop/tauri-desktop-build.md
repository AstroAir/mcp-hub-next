# Tauri Desktop Build Procedure

## 1. Purpose

This SOP documents the Tauri desktop application build process, including configuration quirks and known resolutions. The desktop build bundles a production Next.js server with Node.js runtime and generates MSI installers on Windows. This procedure prevents common build failures and ensures reproducible builds.

## 2. Build Steps

### Prerequisites
- Rust 1.77.2+ installed
- Node.js LTS with `pnpm` package manager
- Windows environment (for MSI builds)

### Web Build
1. Run `pnpm build` to compile Next.js frontend
2. Validates `.next/` and `.next/static/` directories are present
3. Output: Production-ready `.next/` directory

### Desktop Build (MSI)
1. Run `pnpm tauri build` to trigger custom build flow:
   - Executes `scripts/tauri-build.js` (beforeBuildCommand in `src-tauri/tauri.conf.json`)
   - This script: (a) runs web build, (b) generates server launcher, (c) bundles Node.js runtime
2. Rust compilation of `src-tauri/src/lib.rs` and dependencies
3. Tauri bundles `.next/`, `public/`, `src-tauri/resources/` into MSI installer
4. Output: `src-tauri/target/release/bundle/msi/mcp-hub-next_*.msi`

## 3. Critical Configuration Files

- `/src-tauri/tauri.conf.json` - Tauri app configuration
  - `bundle.targets: ["msi"]` - Restricts to MSI only (avoids NSIS timeouts on Windows)
  - `bundle.resources` - Maps build artifacts to bundled resources
  - `build.beforeBuildCommand: "pnpm run build:tauri"` - Triggers custom build script

- `/scripts/tauri-build.js` - Node.js build helper
  - Generates `/src-tauri/resources/server.js` (Next.js server launcher)
  - Copies Node.js binary to `/src-tauri/resources/node/` for bundling
  - Validates `.next/` artifacts exist

- `/eslint.config.mjs` - ESLint configuration
  - Ignores `src-tauri/target/**` to prevent linting Rust build output
  - Allows `require()` in test files via `@typescript-eslint/no-require-imports: off`

- `/next.config.ts` - Next.js configuration
  - Disabled `output: "standalone"` to avoid Windows symlink errors (EPERM)
  - Uses regular `.next/` output instead
  - Sets `images.unoptimized: true` (required for bundled server mode)

## 4. Relevant Code Modules

- `/scripts/tauri-build.js` - Custom build script orchestration
- `/src-tauri/src/lib.rs` - Tauri command handlers and app initialization
- `/src-tauri/src/mcp_lifecycle.rs` - MCP server process management via Rust
- `/src-tauri/tauri.conf.json` - Tauri application manifest
- `/next.config.ts` - Next.js build configuration
- `/eslint.config.mjs` - ESLint rules including linter ignores

## 5. Attention

1. **Do NOT use `output: "standalone"`** in Next.js config - causes Windows symlink (EPERM) failures
2. **NSIS timeout issue resolved** - Bundle targets restricted to `["msi"]` to prevent NSIS download timeouts
3. **Node.js binary bundling** - Script copies `process.execPath` into resources; gracefully falls back to system Node if copy fails
4. **Generated files** - `/src-tauri/resources/server.js` is auto-generated; do not edit manually
5. **Asset prefix** - Dev mode uses `http://localhost:3000`, production uses no prefix
