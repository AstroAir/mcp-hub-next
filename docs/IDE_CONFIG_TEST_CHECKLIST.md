# IDE Config Import Feature - Test Checklist

## Overview
This checklist verifies that the IDE config import feature works correctly across all supported IDEs, transport types, and edge cases.

## Test Environment Setup
- [ ] Desktop mode (Tauri) environment ready
- [ ] Web mode (browser) environment ready
- [ ] Test IDE config files prepared for each supported IDE

## Supported IDE Formats

### 1. Claude Desktop
- [ ] Config file location: `~/.config/Claude/claude_desktop_config.json` (Linux/Mac) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
- [ ] Format: `{ "mcpServers": { ... } }`
- [ ] Can discover config automatically
- [ ] Can import stdio servers
- [ ] Can import SSE servers
- [ ] Can import HTTP servers

### 2. VS Code
- [ ] Config file location: `~/.vscode/settings.json` or workspace `.vscode/settings.json`
- [ ] Format: `{ "mcp.servers": { ... } }`
- [ ] Can discover config automatically
- [ ] Can import all transport types

### 3. Cursor
- [ ] Config file location: `~/.cursor/config.json`
- [ ] Format: `{ "cursor.mcp.servers": { ... } }` or `{ "mcp.servers": { ... } }`
- [ ] Can discover config automatically
- [ ] Can import all transport types

### 4. Windsurf
- [ ] Config file location: `~/.windsurf/config.json`
- [ ] Format: `{ "mcp.servers": { ... } }`
- [ ] Can discover config automatically
- [ ] Can import all transport types

### 5. Zed
- [ ] Config file location: `~/.config/zed/settings.json`
- [ ] Format: `{ "context_servers": { ... } }`
- [ ] Can discover config automatically
- [ ] Can import all transport types

### 6. Cline
- [ ] Config file location: VS Code extension settings
- [ ] Format: `{ "mcpServers": { ... } }`
- [ ] Can import via manual file upload
- [ ] Can import all transport types

### 7. Continue
- [ ] Config file location: `~/.continue/config.json`
- [ ] Format: `{ "mcpServers": { ... } }`
- [ ] Can discover config automatically
- [ ] Can import all transport types

## Transport Type Tests

### stdio Transport
- [ ] Command-only server imports correctly
- [ ] Command with args imports correctly
- [ ] Environment variables are preserved
- [ ] Working directory (cwd) is preserved
- [ ] Server can be started after import
- [ ] Server can be stopped after import
- [ ] Server can be restarted after import

### SSE Transport
- [ ] URL is correctly imported
- [ ] Headers are preserved (if any)
- [ ] Connection can be established after import
- [ ] Connection can be disconnected after import

### HTTP Transport
- [ ] URL is correctly imported
- [ ] Headers are preserved (if any)
- [ ] Connection can be established after import
- [ ] Connection can be disconnected after import

## Edge Cases and Error Handling

### File System
- [ ] Config file not found - shows appropriate error
- [ ] Config file not readable (permissions) - shows appropriate error
- [ ] Config file is empty - shows appropriate warning
- [ ] Config file is not valid JSON - shows parse error
- [ ] Config file has no MCP servers section - shows appropriate message

### Server Configuration
- [ ] Empty servers object - shows "no servers found" message
- [ ] Server with missing required fields - shows validation error
- [ ] Server with invalid transport type - shows validation error
- [ ] Server with malformed URL (for SSE/HTTP) - shows validation error
- [ ] Server with invalid command path (for stdio) - imports but may fail on start

### Duplicate Handling
- [ ] Duplicate server name - automatically renamed with counter (e.g., "Server (1)")
- [ ] Multiple duplicates - each gets unique counter
- [ ] Toast notification shows count of renamed duplicates
- [ ] Renamed servers are functional

### User Feedback
- [ ] Discovery shows loading state while scanning
- [ ] Discovery shows count of configs found
- [ ] Discovery shows "no configs found" when appropriate
- [ ] Import shows loading state while processing
- [ ] Import shows success toast with count and IDE type
- [ ] Import shows error toast with specific error message
- [ ] Import shows warning toast when no servers found
- [ ] Import shows info toast when duplicates are renamed

## UI/UX Tests

### IDE Config Discovery Dialog
- [ ] Dialog opens when triggered
- [ ] "Discover IDE Configs" button works
- [ ] Discovery results are displayed correctly
- [ ] Each discovery shows IDE type, path, and server count
- [ ] Import button is enabled for valid configs
- [ ] Import button shows loading state during import
- [ ] Dialog closes after successful import
- [ ] Dialog stays open after failed import (for retry)

### Config Uploader
- [ ] File picker opens when triggered
- [ ] Can select single JSON file
- [ ] Can select multiple JSON files
- [ ] Can select directory containing JSON files
- [ ] Validation runs before import
- [ ] Validation results are displayed
- [ ] Import button is enabled only after successful validation
- [ ] Import completes successfully

## Integration Tests

### Server Management
- [ ] Imported servers appear in server list
- [ ] Imported servers have correct configuration
- [ ] Imported servers can be edited
- [ ] Imported servers can be deleted
- [ ] Imported servers can be enabled/disabled
- [ ] Imported servers persist after app restart

### Connection Management
- [ ] Can connect to imported stdio servers
- [ ] Can connect to imported SSE servers
- [ ] Can connect to imported HTTP servers
- [ ] Connection status is correctly displayed
- [ ] Can disconnect from imported servers

### Chat Integration
- [ ] Can use tools from imported servers in chat
- [ ] Can use prompts from imported servers in chat
- [ ] Can access resources from imported servers in chat

## Internationalization
- [ ] All toast messages are translated (English)
- [ ] All toast messages are translated (Chinese)
- [ ] All UI labels are translated
- [ ] Error messages are translated

## Performance
- [ ] Discovery completes in reasonable time (<2s for typical system)
- [ ] Import completes in reasonable time (<1s for typical config)
- [ ] No memory leaks during repeated imports
- [ ] No UI freezing during operations

