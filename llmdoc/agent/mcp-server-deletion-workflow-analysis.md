# MCP Server Deletion/Uninstallation Workflow Analysis

## Investigation Purpose

This document analyzes the MCP server deletion and uninstallation workflow to identify what functionality exists, what is missing, and what should be implemented in the Rust backend.

## Evidence: Current Deletion Functionality

### Code Section: Frontend Server Store Deletion

**File:** `lib/stores/server-store.ts`
**Lines:** 53-58
**Purpose:** Remove server configuration from frontend state

```typescript
removeServer: (id: string) => {
  set((state) => ({
    servers: state.servers.filter((server) => server.id !== id),
  }));
  get().saveServers();
},
```

**Key Details:**
- Removes server from Zustand store
- Persists change to localStorage
- Only removes configuration, not installed files
- No cleanup of running processes

### Code Section: Frontend Installation Cleanup

**File:** `lib/stores/server-store.ts`
**Lines:** 106-113
**Purpose:** Remove installation progress tracking

```typescript
removeInstallation: (installId: string) => {
  set((state) => {
    const { [installId]: __removed, ...rest } = state.installations;
    void __removed; // mark as used for lint
    return { installations: rest };
  });
  get().saveInstallations();
},
```

**Key Details:**
- Cleans up installation progress state
- Does not delete installed files
- No Tauri command invocation

### Code Section: Frontend Installed Server Metadata Cleanup

**File:** `lib/stores/server-store.ts`
**Lines:** 129-136
**Purpose:** Remove metadata about installed servers

```typescript
removeInstalledServer: (serverId: string) => {
  set((state) => {
    const { [serverId]: __removed, ...rest } = state.installedServers;
    void __removed; // mark as used for lint
    return { installedServers: rest };
  });
  get().saveInstallations();
},
```

**Key Details:**
- Removes metadata only
- No actual file deletion
- No package uninstallation

### Code Section: Storage Module - No Uninstall Commands

**File:** `src-tauri/src/storage.rs`
**Lines:** 1-544
**Purpose:** Provides data persistence commands

```rust
// Available commands:
save_servers, load_servers
save_chat_sessions, load_chat_sessions
save_settings, load_settings
save_connection_history, load_connection_history
save_backup, load_backup, delete_backup, list_backups
clear_all_data
```

**Key Details:**
- No `uninstall_server` or `delete_server_files` commands
- `clear_all_data` deletes entire app data directory
- `delete_backup` exists for backup management only

### Code Section: Installer Module - No Uninstall Function

**File:** `src-tauri/src/mcp_installer.rs`
**Lines:** 146-161
**Purpose:** Installation-related commands

```rust
#[tauri::command]
pub fn cancel_install(install_id: String) -> Result<(), String> {
    update(&install_id, |p| {
        p.status=InstallationStatus::Cancelled;
        p.message="Installation cancelled".into();
        p.completed_at=Some(now_iso());
    });
    Ok(())
}

#[tauri::command]
pub fn cleanup_install(install_id: String) -> Result<(), String> {
    installs().lock().map_err(|_|"Lock poisoned")?.remove(&install_id);
    Ok(())
}
```

**Key Details:**
- `cancel_install` only updates status
- `cleanup_install` removes tracking state only
- No actual file/package uninstallation commands
- No `uninstall_server` command exists

### Code Section: Registered Commands - No Uninstall

**File:** `src-tauri/src/lib.rs`
**Lines:** 200-210
**Purpose:** List all registered Tauri commands

```rust
// MCP installer
mcp_installer::validate_install,
mcp_installer::install_server,
mcp_installer::get_install_progress,
mcp_installer::cancel_install,
mcp_installer::cleanup_install,
// MCP registry
mcp_registry::registry_search,
mcp_registry::registry_categories,
mcp_registry::registry_popular,
mcp_registry::registry_refresh,
```

**Key Details:**
- No uninstall-related commands registered
- `cleanup_install` is not uninstallation
- Registry commands are read-only

### Code Section: Frontend Service - Installation Cleanup

**File:** `lib/services/mcp-installer.ts`
**Lines:** 316-328
**Purpose:** Frontend installation cleanup logic

```typescript
export function cleanupInstallation(installId: string): void {
  activeInstallations.delete(installId);
  activeProcesses.delete(installId);
  // Best-effort cleanup of install directory
  try {
    const dir = join(INSTALL_BASE_DIR, installId);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch {
    // ignore
  }
}
```

**Key Details:**
- Frontend has cleanup logic for web mode
- Uses Node.js `fs.rmSync` with `recursive: true`
- Only cleans temporary install directories
- Does not uninstall npm packages or git repositories

## Findings: Deletion Workflow Status

### What Exists

1. **Configuration Deletion (Complete)**
   - Frontend can remove server configs from store
   - Persisted to localStorage/Tauri storage
   - No backend involvement needed

2. **State Cleanup (Complete)**
   - Installation progress tracking can be cleared
   - Metadata about installations can be removed
   - Connection state cleanup exists in other stores

3. **Data Directory Clearing (Complete)**
   - `clear_all_data()` command removes entire app data directory
   - Nuclear option for complete reset
   - Not suitable for individual server uninstallation

### What is Missing

1. **Uninstall Command (Critical - Not Implemented)**
   - No `uninstall_server` or `delete_installed_server` Tauri command
   - No backend logic to delete installed files
   - No package manager uninstall invocation (npm uninstall, etc.)

2. **Installation Directory Cleanup (Critical - Not Implemented)**
   - No tracking of what was installed where
   - No metadata mapping install_id → installation path
   - Cannot reliably locate files to delete

3. **Package Manager Uninstallation (Critical - Not Implemented)**
   - No `npm uninstall` invocation
   - No git repository deletion
   - No package.json dependency cleanup

4. **Process Termination (High Priority - Not Implemented)**
   - No server process stopping before deletion
   - Could leave orphaned processes
   - Should integrate with `mcp_lifecycle::mcp_stop_server`

5. **Rollback on Failure (Medium Priority - Not Implemented)**
   - No backup before deletion
   - No ability to undo uninstallation
   - No error recovery

6. **Partial Cleanup Handling (Low Priority - Not Implemented)**
   - No handling of partially deleted installations
   - No retry mechanism
   - No cleanup verification

### Required Implementation

To implement a complete uninstallation workflow, the following is needed:

**Rust Backend Command:**
```rust
#[tauri::command]
pub fn uninstall_server(
    app: AppHandle,
    server_id: String,
    config: InstallConfig
) -> Result<(), String>
```

**Required Logic:**
1. Look up installation metadata (install path, source type)
2. Stop any running server processes via `mcp_stop_server`
3. Based on source type:
   - **npm**: Run `npm uninstall {package}` or delete directory
   - **github**: Delete cloned repository directory
   - **local**: Remove reference only (don't delete user files)
4. Clean up installation metadata
5. Report errors if deletion fails
6. Return success/failure status

**Required Metadata:**
- Installation path mapping (install_id → path)
- Installation source type (npm, github, local)
- Package/repository name
- Installation timestamp

## Overall Status

MCP server deletion workflow is **NOT IMPLEMENTED** in the Rust backend. The frontend has:
- Configuration removal (complete)
- State cleanup (complete)
- Temporary directory cleanup for web mode (incomplete, not integrated with Tauri)

**Critical gaps:**
1. No Tauri `uninstall_server` command
2. No installation metadata persistence
3. No package manager uninstall logic
4. No integration with process lifecycle management

**Recommendation:** Implement complete uninstallation workflow in Rust backend with proper metadata tracking, process termination, and package manager integration.
