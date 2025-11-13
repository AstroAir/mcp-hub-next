# Tauri Desktop Build Procedure

## 1. Purpose

This SOP documents the core Tauri desktop application build process and configuration. The build bundles a production Next.js server with Node.js runtime and generates platform-specific installers. For comprehensive multi-platform build instructions, see [Multi-Platform Installer Build](multi-platform-installer-build.md).

## 2. Build Steps

### Prerequisites
- Rust 1.77.2+ installed
- Node.js LTS with `pnpm` package manager
- Platform-specific build tools (WiX/NSIS on Windows, dev libs on Linux, Xcode on macOS)

### Build Command
```bash
pnpm tauri build
```

This executes:
1. Custom build script: `scripts/tauri-build.js`
   - Runs Next.js production build → `.next/` directory
   - Generates server launcher → `src-tauri/resources/server.js`
   - Bundles Node.js runtime → `src-tauri/resources/node/`
2. Rust compilation of `src-tauri/src/lib.rs` and dependencies
3. Tauri bundles `.next/`, `public/`, and `src-tauri/resources/` into installers
4. Output: Platform-specific installers in `src-tauri/target/release/bundle/`

### Build Artifacts

- **Windows**: MSI installer + NSIS executable (MSI recommended for enterprise)
- **Linux**: DEB package + AppImage binary
- **macOS**: DMG disk image + APP bundle

## 3. Critical Configuration Files

- `src-tauri/tauri.conf.json` - Tauri app manifest
  - `bundle.targets` - Platform-specific installer types
  - `bundle.resources` - Maps build artifacts to bundle
  - `build.beforeBuildCommand` - Invokes custom build script

- `scripts/tauri-build.js` - Node.js build orchestration
  - Generates `src-tauri/resources/server.js` (Next.js server launcher)
  - Copies Node.js binary to `src-tauri/resources/node/`
  - Validates `.next/` and `.next/static/` exist

- `src-tauri/src/lib.rs` - Rust command handlers
  - Defines Tauri commands for lifecycle, registry, storage, updates

- `next.config.ts` - Next.js configuration
  - **Disabled** `output: "standalone"` (prevents Windows symlink errors)
  - Sets `images.unoptimized: true` (required for bundled server)

- `eslint.config.mjs` - Linter configuration
  - Ignores `src-tauri/target/**` to prevent linting Rust build output

## 4. Relevant Code Modules

- `scripts/tauri-build.js` - Custom build orchestration
- `src-tauri/src/lib.rs` - Tauri command definitions
- `src-tauri/src/mcp_lifecycle.rs` - MCP process lifecycle (Rust)
- `src-tauri/tauri.conf.json` - Application manifest
- `next.config.ts` - Next.js build configuration
- `eslint.config.mjs` - ESLint rules

## 5. Attention

1. **Do NOT use `output: "standalone"`** in Next.js config - causes Windows symlink EPERM errors
2. **NSIS timeout on slow networks**: Temporarily change targets to `["msi"]` in `tauri.conf.json`
3. **Node.js bundling**: Script copies `process.execPath` to resources; falls back to system Node on failure
4. **Platform-specific output**: Tauri only builds for current OS; use CI/CD for all platforms
5. **Generated files**: Do not manually edit `src-tauri/resources/server.js` (auto-generated)
6. **Asset prefix**: Dev mode uses `http://localhost:3000`, production uses no prefix
