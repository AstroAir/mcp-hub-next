# IDE Configuration Support

## 1. Purpose

This feature enables seamless integration with existing IDE configurations from Claude Desktop, VSCode extensions (MCP, Cline, Continue), and other clients. It allows users to discover IDE config files on their system, validate them, and import/export MCP server configurations between MCP Hub and other IDEs. This eliminates manual configuration duplication and enables workflow portability across development environments.

## 2. How it Works

### IDE Client Type Tracking

Extended `InstallMetadata` struct now tracks:
- `client_type: Option<String>` - IDE/client that installed the server (e.g., "claude-desktop", "vscode", "cline", "mcp-hub")
- `original_config: Option<String>` - Original configuration JSON for potential reconstruction
- `config_source_path: Option<String>` - Path to the IDE config file this was imported from

Extended `BaseMCPServerConfig` with `MCPClientType` fields to track server origin across the application.

### Supported IDE Clients

1. **Claude Desktop** (`claude-desktop`)
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. **VSCode MCP Extension** (`vscode`)
   - macOS: `~/Library/Application Support/Code/User/settings.json`
   - Windows: `%APPDATA%\Code\User\settings.json`
   - Linux: `~/.config/Code/User/settings.json`

3. **Cline Extension** (`cline`)
   - Uses same VSCode config paths as above

4. **Continue Extension** (`continue`)
   - Uses same VSCode config paths as above

5. **Custom Clients** (`custom`)
   - User-specified configuration file paths

### Configuration Discovery Flow

1. **discover_ide_configs()** scans system for known IDE config locations:
   - Returns `ConfigDiscovery[]` array with metadata about each found config
   - Includes file path, readability status, server count, and server names
   - Non-blocking: missing configs simply return `found: false`

2. **validate_ide_config(path, clientType)** validates a config file:
   - Checks file existence and readability
   - Parses JSON and validates structure
   - Returns `ConfigValidation` with error/warning lists
   - Verifies each server has a command (warns if missing)
   - Warns if commands lack PATH qualification

3. **import_ide_config(path, clientType, mergeStrategy)** converts IDE configs to MCP Hub format:
   - Parses IDE config from specified path
   - Converts each server to `StdioMCPServerConfig`
   - Assigns unique nanoid, timestamps, and metadata
   - Returns JSON array of converted servers ready for storage
   - Stores original config and source path for potential re-export

4. **export_to_ide_format(serversJson, clientType, outputPath)** converts MCP Hub configs to IDE format:
   - Parses input server JSON array
   - Converts to IDE-specific config structure (mcpServers object)
   - Optionally writes to output file
   - Returns formatted JSON string ready for IDE consumption

5. **validate_config_path(path, mustExist)** normalizes and validates file paths:
   - Cross-platform path validation
   - Optional existence checking
   - Returns normalized absolute path

### Data Flow: Import Scenario

```
IDE Config File
    ↓
discover_ide_configs() → ConfigDiscovery[] (find available configs)
    ↓
validate_ide_config(path) → ConfigValidation (validate before import)
    ↓
import_ide_config(path, clientType) → JSON array of servers
    ↓
Frontend creates servers via useServerStore.addServer()
    ↓
Servers persisted with clientType + configSourcePath metadata
```

### Data Flow: Export Scenario

```
MCP Hub Servers (from store)
    ↓
export_to_ide_format(servers, clientType) → IDE-formatted JSON
    ↓
optionally write to IDE config path
    ↓
IDE reads updated config at next startup
```

### Client Type in Server Lifecycle

When a server is imported from an IDE config:
- Its `clientType` field indicates the original source
- `configSourcePath` enables future sync/re-export back to that IDE
- `originalConfig` allows reconstructing the exact original format if needed
- These fields are optional and do not affect server operation

When a server is created in MCP Hub UI:
- `clientType` defaults to "mcp-hub"
- No `configSourcePath` or `originalConfig` unless explicitly set during import

## 3. Relevant Code Modules

- `/src-tauri/src/ide_config.rs` - Core IDE config parsing, discovery, import/export logic
- `/src-tauri/src/mcp_installer.rs` - `InstallMetadata` struct with client_type fields (lines 39-47)
- `/src-tauri/src/lib.rs` - Tauri command handler registration for IDE config commands
- `/lib/types/mcp.ts` - `MCPClientType` type definition and `BaseMCPServerConfig` fields (lines 18-43)
- `/lib/types/tauri.ts` - TypeScript type definitions for IDE config Tauri commands (lines 133-151, 237-242)
- `/lib/services/tauri-bridge.ts` - Runtime-safe wrapper for invoking IDE config discovery/import/export commands

## 4. Attention

1. **Config file discovery** only scans default IDE paths; custom IDE installations may have configs elsewhere
2. **VSCode settings.json** is a large file; parsing filters for `mcpServers` section only
3. **Original config preservation** requires storing JSON strings; consider cleanup for long-running applications
4. **Cross-platform paths** use platform-specific environment variables (APPDATA, HOME); absolute paths required for validation
5. **Merge strategy** parameter (reserve for future use) currently defaults to "merge" but not fully implemented
6. **Re-export to IDE** should verify target IDE is not currently running to avoid file conflicts
7. **Server naming** during import uses keys from IDE config; ensure uniqueness in MCP Hub store
