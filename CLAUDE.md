# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MCP Hub Next** is a desktop application for managing Model Context Protocol (MCP) servers. Built with Next.js 16 + Tauri 2.9, it provides a GUI for:
- Installing and configuring MCP servers (stdio, SSE, HTTP transports)
- Managing server lifecycles (start, stop, restart, health monitoring)
- Browsing and installing servers from the MCP marketplace
- Chatting with AI models using connected MCP tools
- Managing AI model configurations and OAuth authentication

### Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- **Desktop**: Tauri 2.9 (Rust) for native capabilities and MCP process management
- **UI**: shadcn/ui components with Radix UI primitives
- **State**: Zustand stores for servers, connections, chat, lifecycle, marketplace, settings
- **i18n**: next-intl for internationalization
- **Testing**: Jest with React Testing Library

## Development Commands

### Frontend Development

```bash
# Install dependencies
pnpm install

# Start Next.js dev server (web-only, http://localhost:3000)
pnpm dev

# Build Next.js for production
pnpm build

# Run tests
pnpm test
pnpm test:watch
pnpm test:coverage

# Lint
pnpm lint
```

### Tauri Desktop Development

```bash
# Run desktop app with hot reload (starts Next.js dev + Tauri window)
pnpm tauri dev

# Build desktop installer (uses custom build script)
pnpm tauri build

# Check Tauri environment
pnpm tauri info
```

### Testing

Tests use Jest + React Testing Library with coverage thresholds enforced:
- Run single test: `pnpm test path/to/test.test.ts`
- Watch mode: `pnpm test:watch`
- Coverage report: `pnpm test:coverage` (outputs to `coverage/`)

Test files are colocated with source code:
- `lib/**/*.test.ts` - Service/utility tests
- `lib/hooks/**/*.test.ts` - Custom hook tests
- `hooks/**/*.test.ts` - Shared hook tests
- `lib/stores/**/*.test.ts` - Zustand store tests

## Architecture

### MCP Server Management

The app manages three MCP transport types defined in `lib/types/mcp.ts`:
1. **stdio**: Spawns local process, communicates via stdin/stdout
2. **SSE**: Connects to remote server via Server-Sent Events
3. **HTTP**: Connects to remote server via HTTP requests

**Process Lifecycle (stdio servers only)**:
- **Frontend**: `lib/services/mcp-process-manager.ts` (Node.js child_process for web mode)
- **Tauri**: `src-tauri/src/mcp_lifecycle.rs` (Rust Command API for desktop mode)
- States: `stopped` → `starting` → `running` → `stopping` → `stopped`

**Connection Management**:
- `lib/services/mcp-client.ts` - MCP SDK client wrapper
- `lib/services/connection-pool.ts` - Connection pooling and reuse
- `lib/stores/connection-store.ts` - Active connection state

### State Management (Zustand)

All stores exported from `lib/stores/index.ts`:
- `useServerStore` - Server configurations (CRUD, persistence)
- `useConnectionStore` - Active MCP connections and tools
- `useChatStore` - Chat sessions and messages
- `useLifecycleStore` - Server process states
- `useRegistryStore` - MCP registry browsing
- `useMarketplaceStore` - Marketplace server discovery
- `useSettingsStore` - App settings and preferences
- `useModelStore` - AI model configurations and OAuth tokens
- `useUIStore` - UI state (modals, sidebars, themes)

### Tauri Integration

**Build Process**:
- Uses custom build script: `scripts/tauri-build.js`
- Bundles `.next/` directory (NOT static export) with Node.js runtime
- Rust backend launches embedded Next.js server on port 34115
- Configuration: `src-tauri/tauri.conf.json`

**Tauri Commands** (defined in `src-tauri/src/lib.rs`):
- `mcp_lifecycle.rs` - Start/stop/restart stdio servers, get process status
- `mcp_registry.rs` - Fetch marketplace registry data
- `mcp_installer.rs` - Install packages (npm, pip, etc.)
- `storage.rs` - Persistent data storage (servers, chats, settings, backups)
- `secure_storage.rs` - Keychain/credential storage for OAuth tokens
- `file_dialogs.rs` - File/folder pickers, read/write files
- `updates.rs` - Auto-update functionality

**Runtime Detection**:
- `lib/services/tauri-bridge.ts` provides `isTauri()` check and `invoke()` wrapper
- Use this to conditionally call Tauri commands vs. fallback implementations

### Internationalization

- Uses `next-intl` with locale prefix routing: `/[locale]/...`
- Config: `i18n/request.ts`
- Messages: `messages/{locale}.json`
- Pages: `app/[locale]/*/page.tsx`

### Page Structure

```
app/
├── [locale]/           # Localized routes
│   ├── page.tsx       # Dashboard/home
│   ├── servers/       # Server management
│   ├── marketplace/   # Marketplace browsing
│   ├── chat/          # AI chat interface
│   ├── settings/      # App settings
│   └── developer/     # Developer tools
├── page.tsx           # Root redirect to locale
└── oauth/callback/    # OAuth callback handler
```

### Service Layer

**Core Services** (`lib/services/`):
- `tauri-bridge.ts` - Tauri runtime detection and invoke wrapper
- `mcp-client.ts` - MCP SDK client for tools/prompts/resources
- `mcp-process-manager.ts` - Node.js process manager (web mode)
- `connection-pool.ts` - MCP connection pooling
- `mcp-registry.ts` - Fetch servers from MCP registry
- `marketplace.ts` - Marketplace server discovery
- `mcp-installer.ts` - Package installation orchestration
- `llm-router.ts` - AI model routing (Anthropic SDK)
- `oauth-service.ts` - OAuth 2.1 PKCE flow handler
- `health-monitor.ts` - Server health checks and monitoring
- `backup-service.ts` - Configuration backup/restore
- `rate-limiter.ts` - API rate limiting
- `debug-logger.ts` - Debug logging utilities

**Utilities** (`lib/utils/`):
- `config-parser.ts` - Parse MCP configs from Claude Desktop/VSCode
- `ide-config-parsers.ts` - IDE-specific config parsers
- `storage.ts` - LocalStorage/Tauri storage abstraction
- `file-upload.ts` - File attachment handling
- `error-dedupe.ts` - Error deduplication for UI
- `shortcuts.ts` - Keyboard shortcut utilities

### Custom Hooks

- `use-mcp-connection.ts` - MCP connection lifecycle management
- `use-streaming-chat.ts` - Streaming chat with tool execution
- `use-health-monitor.ts` - Server health monitoring
- `use-command-palette.ts` - Command palette functionality
- `use-mobile.ts` - Mobile detection

### Path Aliases

Configured in `components.json` and `tsconfig.json`:
- `@/components` → `components/`
- `@/lib` → `lib/`
- `@/utils` → `lib/utils.ts`
- `@/ui` → `components/ui/`
- `@/hooks` → `hooks/`

## Key Implementation Patterns

### Tauri Command Invocation

Always use the tauri-bridge wrapper for runtime safety:

```typescript
import { isTauri, invoke } from '@/lib/services/tauri-bridge';

if (isTauri()) {
  const result = await invoke<ServerConfig[]>('load_servers');
} else {
  // Fallback for web mode (localStorage, etc.)
}
```

### MCP Server Configuration

All server configs extend `BaseMCPServerConfig` from `lib/types/mcp.ts`:
- Must have unique `id` (nanoid)
- Must specify `transportType`: `'stdio' | 'sse' | 'http'`
- Stdio servers require `command` and optional `args`, `env`, `cwd`
- Remote servers require `url` and optional `headers`

### Store Persistence

Stores auto-persist via `storage.ts` abstraction:
- **Desktop**: Tauri commands → `{app_data}/mcp-hub/` JSON files
- **Web**: LocalStorage fallback

### Adding shadcn/ui Components

```bash
pnpm dlx shadcn@latest add [component-name]
```

Components install to `components/ui/` with configured aliases and New York style.

## Testing Strategy

- **Unit tests**: Services, utilities, stores (mock MCP SDK in `lib/__tests__/mocks/`)
- **Integration tests**: Hooks (use React Testing Library)
- **Fixtures**: Test data in `lib/__tests__/fixtures/`
- **Coverage thresholds**: 60% branches/functions, 70% lines/statements

## Build Quirks

1. **Tauri builds**: Use custom script that bundles `.next/` + Node.js (not static export)
2. **Next.js config**: Sets `assetPrefix` for Tauri dev mode, `images.unoptimized: true`
3. **Rust dependencies**: Requires Rust 1.77.2+ for Tauri 2.9
4. **Windows symlinks**: Avoided by using custom build script instead of `next build standalone`

## Common Workflows

### Adding a New MCP Server Type

1. Update types in `lib/types/mcp.ts`
2. Add form component in `components/mcp/`
3. Update server store validation in `lib/stores/server-store.ts`
4. Add connection logic in `lib/services/mcp-client.ts`

### Adding a New Tauri Command

1. Implement in `src-tauri/src/{module}.rs`
2. Export in `src-tauri/src/lib.rs` via `invoke_handler!`
3. Add TypeScript types in `lib/types/tauri.ts`
4. Call via `invoke()` from `lib/services/tauri-bridge.ts`

### Adding a New Store

1. Create store in `lib/stores/{name}-store.ts` using Zustand
2. Export from `lib/stores/index.ts`
3. Add persistence if needed via `storage.ts`
4. Write tests in `lib/stores/{name}-store.test.ts`