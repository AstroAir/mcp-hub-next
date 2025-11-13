# Multi-Platform Installer Build Procedure

## 1. Purpose

This SOP documents how to build desktop application installers for Windows, Linux, and macOS using Tauri. The build process generates platform-specific installers (MSI/NSIS on Windows, DEB/AppImage on Linux, DMG/APP on macOS) from a single codebase. This procedure ensures consistent cross-platform builds and provides resolutions for common platform-specific issues.

## 2. Build Process Overview

### Step 1: Prepare Build Environment
Verify prerequisites for your target platform(s):
- **Windows**: Visual Studio Build Tools with C++ workload (Tauri auto-downloads WiX/NSIS)
- **Linux**: System libraries (see prerequisites below)
- **macOS**: Xcode Command Line Tools
- **All platforms**: Rust 1.77.2+, Node.js LTS, pnpm

### Step 2: Execute Build Command
```bash
pnpm tauri build
```

This command performs:
1. Runs custom build script: `scripts/tauri-build.js`
   - Executes Next.js production build → `.next/` directory
   - Generates server launcher → `src-tauri/resources/server.js`
   - Bundles Node.js runtime → `src-tauri/resources/node/`
2. Compiles Rust backend (platform-specific)
3. Generates installers to `src-tauri/target/release/bundle/`

### Step 3: Retrieve Build Artifacts
Locate platform-specific outputs in `src-tauri/target/release/bundle/`:
- **Windows**: `msi/` and `nsis/` directories
- **Linux**: `deb/` and `appimage/` directories
- **macOS**: `dmg/` and `macos/` directories

### Platform-Specific Prerequisites

**Linux (Debian/Ubuntu)**:
```bash
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

**Linux (Fedora)**:
```bash
sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget file \
  libappindicator-gtk3-devel librsvg2-devel
```

**Linux (Arch)**:
```bash
sudo pacman -S webkit2gtk-4.1 base-devel curl wget file \
  openssl libappindicator-gtk3 librsvg
```

**macOS**:
```bash
xcode-select --install
```

### Build Outputs

**Windows**:
- MSI: `src-tauri/target/release/bundle/msi/mcp-hub-next_0.1.0_x64_en-US.msi`
- NSIS: `src-tauri/target/release/bundle/nsis/mcp-hub-next_0.1.0_x64-setup.exe`

**Linux**:
- DEB: `src-tauri/target/release/bundle/deb/mcp-hub-next_0.1.0_amd64.deb`
- AppImage: `src-tauri/target/release/bundle/appimage/mcp-hub-next_0.1.0_amd64.AppImage`

**macOS**:
- DMG: `src-tauri/target/release/bundle/dmg/mcp-hub-next_0.1.0_x64.dmg`
- APP: `src-tauri/target/release/bundle/macos/mcp-hub-next.app`

### Cross-Platform Building (CI/CD)

Tauri only builds for the current OS. To build all platforms:

1. **GitHub Actions** (recommended): Set up matrix jobs for `ubuntu-latest`, `macos-latest`, `windows-latest`
2. **Virtual Machines**: Run builds separately on each OS
3. **Docker** (Linux only): Build Linux installers from any OS using Docker
4. **Note**: macOS binaries **must** be built on Apple hardware (licensing restriction)

## 3. Critical Configuration Files

- `src-tauri/tauri.conf.json` - Tauri manifest
  - `bundle.targets: ["msi", "nsis", "deb", "appimage", "dmg", "app"]` - Platform targets
  - `bundle.resources` - Maps `.next/`, `public/`, and `resources/` to bundle
  - `build.beforeBuildCommand: "pnpm run build:tauri"` - Invokes custom build

- `scripts/tauri-build.js` - Node.js orchestration
  - Generates `src-tauri/resources/server.js` (Next.js HTTP server launcher)
  - Copies Node.js binary to `src-tauri/resources/node/` for bundling
  - Validates `.next/` and `.next/static/` exist post-build

- `src-tauri/src/lib.rs` - Rust command handlers
  - Tauri command definitions for lifecycle, registry, installer, storage, updates

- `next.config.ts` - Next.js build configuration
  - **Disabled** `output: "standalone"` (prevents Windows symlink errors)
  - Sets `images.unoptimized: true` (required for bundled server mode)

- `eslint.config.mjs` - ESLint configuration
  - Ignores `src-tauri/target/**` to prevent linting Rust build artifacts

## 4. Relevant Code Modules

- `scripts/tauri-build.js` - Custom build orchestration
- `src-tauri/src/lib.rs` - Tauri command handlers
- `src-tauri/src/mcp_lifecycle.rs` - Process lifecycle management
- `src-tauri/tauri.conf.json` - Application manifest with bundle targets
- `next.config.ts` - Next.js production configuration
- `eslint.config.mjs` - Linter configuration

## 5. Attention

1. **Do NOT use `output: "standalone"`** in Next.js config - causes Windows symlink EPERM errors
2. **NSIS download timeout**: If builds hang, temporarily change targets to `["msi"]` in `tauri.conf.json`
3. **Platform-specific outputs**: Tauri only builds for current OS; use CI/CD or VMs for all platforms
4. **Node.js bundling**: Script copies `process.execPath` to resources; gracefully falls back to system Node on failure
5. **macOS code signing**: Optional; unsigned apps trigger security prompts but remain functional
6. **Generated files**: Do not manually edit `src-tauri/resources/server.js` (auto-generated on each build)
7. **Asset prefix**: Dev mode uses `http://localhost:3000`, production uses no prefix
