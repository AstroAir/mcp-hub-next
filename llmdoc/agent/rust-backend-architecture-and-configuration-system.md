# Rust Backend Architecture and Configuration System

## Evidence Section

<CodeSection>

## Code Section: Tauri Command Registry

**File:** `src-tauri/src/lib.rs`
**Lines:** 161-234
**Purpose:** Central command handler registration for all Tauri commands across modules

```rust
.invoke_handler(tauri::generate_handler![
  // Update commands
  updates::get_app_version,
  updates::get_update_preferences,
  // Storage commands
  storage::get_app_data_path,
  storage::save_servers,
  storage::load_servers,
  // File dialog commands
  file_dialogs::open_file_dialog,
  // Secure storage commands
  secure_storage::save_credential,
  // MCP lifecycle
  mcp_lifecycle::mcp_start_server,
  // MCP installer
  mcp_installer::validate_install,
  // MCP registry
  mcp_registry::registry_search,
])
```

**Key Details:**

- 32 total Tauri commands registered
- Commands organized by module (updates, storage, file_dialogs, secure_storage, mcp_lifecycle, mcp_installer, mcp_registry)
- Installation metadata loaded on startup from persistent storage
- Update checks run conditionally on startup based on user preferences

</CodeSection>

<CodeSection>

## Code Section: MCP Server Configuration Types

**File:** `lib/types/mcp.ts`
**Lines:** 18-71
**Purpose:** TypeScript interface definitions for all three transport types

```typescript
export interface BaseMCPServerConfig {
  id: string;
  name: string;
  description?: string;
  transportType: MCPTransportType;
  enabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StdioMCPServerConfig extends BaseMCPServerConfig {
  transportType: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export interface SSEMCPServerConfig extends BaseMCPServerConfig {
  transportType: 'sse';
  url: string;
  headers?: Record<string, string>;
  sseEndpoint?: string;
  postEndpoint?: string;
}

export interface HTTPMCPServerConfig extends BaseMCPServerConfig {
  transportType: 'http';
  url: string;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST';
  timeout?: number;
}
```

**Key Details:**

- Three distinct server configuration types: stdio, SSE, and HTTP
- Base configuration contains id, name, timestamps, enabled flag
- Stdio requires command, optional args, environment variables, working directory
- Remote servers (SSE/HTTP) require URL and optional headers/endpoints
- Serialized/deserialized as JSON for persistence

</CodeSection>

<CodeSection>

## Code Section: Stdio Process Lifecycle

**File:** `src-tauri/src/mcp_lifecycle.rs`
**Lines:** 1-106
**Purpose:** Process lifecycle management for stdio servers

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum LifecycleState {
    Stopped,
    Starting,
    Running,
    Stopping,
    Restarting,
    Error,
}

#[tauri::command]
pub fn mcp_start_server(server_id: String, cfg: StdioConfig) -> Result<MCPServerProcess, String> {
    let mut cmd = Command::new(&cfg.command);
    if !cfg.args.is_empty() {
        cmd.args(&cfg.args);
    }
    if let Some(cwd) = &cfg.cwd {
        cmd.current_dir(cwd);
    }
    if !cfg.env.is_empty() {
        cmd.envs(&cfg.env);
    }
    cmd.stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped());

    let child = cmd.spawn().map_err(|e| format!("Failed to start process: {e}"))?;
    // ... store process in global PROCESSES map
}
```

**Key Details:**

- Six lifecycle states defined: stopped, starting, running, stopping, restarting, error
- Processes stored in global OnceLock<Mutex<HashMap>> for runtime access
- Process spawned with stdin/stdout/stderr piped for communication
- Current working directory and environment variables configured per server
- Graceful shutdown attempts SIGTERM on Unix, kills on Windows

</CodeSection>

<CodeSection>

## Code Section: Installation Configuration Types

**File:** `src-tauri/src/mcp_installer.rs`
**Lines:** 1-40
**Purpose:** Installation configuration and metadata structures

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "source")]
pub enum InstallConfig {
    #[serde(rename = "npm")]
    Npm {
        package_name: String,
        version: Option<String>,
        global: Option<bool>,
        registry: Option<String>
    },
    #[serde(rename = "github")]
    GitHub {
        repository: String,
        branch: Option<String>,
        tag: Option<String>,
        commit: Option<String>,
        sub_path: Option<String>
    },
    #[serde(rename = "local")]
    Local {
        path: String,
        validate: Option<bool>
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallMetadata {
    pub server_id: String,
    pub install_id: String,
    pub source_type: String,
    pub install_path: String,
    pub package_name: Option<String>,
    pub repository: Option<String>,
    pub version: Option<String>,
    pub installed_at: String,
}
```

**Key Details:**

- Three installation sources: npm, github, local
- NPM supports custom registry, version constraints, global vs. local installation
- GitHub supports branch, tag, commit, and sub-path specification
- Metadata includes source type, install path, version, and timestamp
- Metadata persisted to disk via `save_installation_metadata` command

</CodeSection>

<CodeSection>

## Code Section: Storage System

**File:** `src-tauri/src/storage.rs`
**Lines:** 1-55
**Purpose:** Persistent data storage for all application state

```rust
fn get_app_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))
}

#[tauri::command]
pub fn save_servers(app: AppHandle, servers: String) -> Result<(), String> {
    let dir = ensure_app_data_dir(&app)?;
    let file_path = dir.join("servers.json");
    fs::write(&file_path, servers)
        .map_err(|e| format!("Failed to save servers: {}", e))?;
    log::info!("Saved servers to {:?}", file_path);
    Ok(())
}

#[tauri::command]
pub fn load_servers(app: AppHandle) -> Result<String, String> {
    let dir = get_app_data_dir(&app)?;
    let file_path = dir.join("servers.json");
    if !file_path.exists() {
        return Ok("[]".to_string());
    }
    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to load servers: {}", e))
}
```

**Key Details:**

- App data directory obtained from Tauri's app.path().app_data_dir()
- Separate JSON files for: servers, chat_sessions, settings, connection_history, installation_metadata
- Backups stored in subdirectory with ID-based filenames
- Commands operate on JSON strings, not deserialized objects
- Returns empty array "[]" if file doesn't exist

</CodeSection>

<CodeSection>

## Code Section: Secure Storage via System Keyring

**File:** `src-tauri/src/secure_storage.rs`
**Lines:** 1-116
**Purpose:** Secure credential storage using OS keyring

```rust
use keyring::Entry;

const SERVICE_NAME: &str = "com.tauri.mcp-hub";
const CREDENTIAL_REGISTRY_KEY: &str = "_credential_registry";

#[tauri::command]
pub fn save_credential(key: String, value: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, &key)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
    entry
        .set_password(&value)
        .map_err(|e| format!("Failed to save credential: {}", e))?;
    add_to_registry(&key)?;
    log::info!("Saved credential for key: {}", key);
    Ok(())
}

#[tauri::command]
pub fn save_oauth_token(server_id: String, token: String) -> Result<(), String> {
    let key = format!("oauth_token_{}", server_id);
    save_credential(key, token)
}

#[tauri::command]
pub fn save_api_key(service: String, api_key: String) -> Result<(), String> {
    let key = format!("api_key_{}", service);
    save_credential(key, api_key)
}
```

**Key Details:**

- Uses keyring crate for OS-level secure storage
- Service name: "com.tauri.mcp-hub"
- Maintains registry of all credential keys
- OAuth tokens stored with "oauth_token_{server_id}" key format
- API keys stored with "api_key_{service}" key format
- Generic credential commands for extensibility

</CodeSection>

<CodeSection>

## Code Section: Registry and Marketplace Search

**File:** `src-tauri/src/mcp_registry.rs`
**Lines:** 1-89
**Purpose:** MCP server discovery from npm and GitHub

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistryServerEntry {
    pub id: String,
    pub name: String,
    pub description: String,
    pub source: InstallationSource,
    pub package_name: Option<String>,
    pub repository: Option<String>,
    pub version: Option<String>,
    pub author: Option<String>,
    pub homepage: Option<String>,
    pub documentation: Option<String>,
    pub tags: Option<Vec<String>>,
    pub downloads: Option<u64>,
    pub stars: Option<u64>,
    pub last_updated: Option<String>,
    pub verified: Option<bool>,
}

fn search_npm(query: Option<&str>) -> Vec<RegistryServerEntry> {
    let q = query.unwrap_or("mcp-server");
    let output = Command::new("npm")
        .args(["search", q, "--json", "--long"])
        .output();
    // Parse npm search JSON response...
}

fn search_github(query: Option<&str>) -> Vec<RegistryServerEntry> {
    let q = query.unwrap_or("mcp-server topic:mcp");
    let output = Command::new("gh")
        .args(["search", "repos", q, "--json", "name,owner,description,url,stargazersCount,updatedAt"])
        .output();
    // Parse gh CLI JSON response...
}
```

**Key Details:**

- 10 hardcoded official MCP servers from @modelcontextprotocol org
- npm search via "npm search --json --long" command
- GitHub search via "gh search repos" CLI command
- Both searches filter for "mcp" keyword
- Registry cached in memory with deduplication by ID
- Search supports query, source filter, tag filter, verified filter, sorting

</CodeSection>

<CodeSection>

## Code Section: Uninstallation System

**File:** `src-tauri/src/mcp_installer.rs`
**Lines:** 262-349
**Purpose:** Complete uninstallation with source-specific cleanup

```rust
#[tauri::command]
pub fn uninstall_server(
    app: AppHandle,
    install_id: String,
    server_id: Option<String>,
    stop_process: Option<bool>
) -> Result<(), String> {
    // Get installation metadata
    let metadata = {
        let meta_map = install_metadata().lock()?;
        meta_map.get(&install_id).cloned()?
    };

    // Stop server process if requested
    if stop_process.unwrap_or(true) {
        if let Some(sid) = server_id.as_ref() {
            let _ = crate::mcp_lifecycle::mcp_stop_server(sid.clone(), Some(false));
        }
    }

    // Uninstall based on source type
    match metadata.source_type.as_str() {
        "npm" => {
            // Try npm uninstall first, fallback to directory deletion
            if let Some(pkg) = metadata.package_name {
                let uninstall_result = Command::new("npm")
                    .args(["uninstall", &pkg, "--prefix", &metadata.install_path])
                    .status();
            }
            // Always delete directory to ensure cleanup
            std::fs::remove_dir_all(&metadata.install_path)?;
        }
        "github" => {
            let path = PathBuf::from(&metadata.install_path);
            std::fs::remove_dir_all(&path)?;
        }
        "local" => {
            // Don't delete user files, just remove metadata reference
        }
    }

    // Remove metadata from in-memory map
    install_metadata().lock()?.remove(&install_id);
    persist_metadata(&app);
    Ok(())
}
```

**Key Details:**

- Stops process before uninstall if server_id provided
- NPM: attempts npm uninstall command, then deletes directory
- GitHub: deletes cloned repository directory
- Local: removes metadata reference only, preserves user files
- Metadata persisted to disk after removal

</CodeSection>

<CodeSection>

## Code Section: File Dialog Operations

**File:** `src-tauri/src/file_dialogs.rs`
**Lines:** 1-100
**Purpose:** File system access via Tauri dialog plugin

```rust
#[tauri::command]
pub async fn open_file_dialog(
    app: AppHandle,
    title: Option<String>,
    filters: Option<Vec<FileFilter>>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let mut builder = app.dialog().file();

    if let Some(title) = title {
        builder = builder.set_title(&title);
    }

    if let Some(filters) = filters {
        for filter in filters {
            let extensions: Vec<&str> = filter.extensions.iter().map(|s| s.as_str()).collect();
            builder = builder.add_filter(&filter.name, &extensions);
        }
    }

    let file = builder.blocking_pick_file();
    Ok(file.map(|f| f.to_string()))
}
```

**Key Details:**

- Uses tauri_plugin_dialog for native file dialogs
- Supports single file, multiple files, and folder selection
- File filters support multiple extensions per category
- Async operations but blocking_pick_file in impl
- Returns platform-specific path as string

</CodeSection>

## Findings Section

### Current Command Inventory

The Rust backend implements 32 Tauri commands across 7 modules:

**Update Commands (7)**
- `get_app_version` - Returns installed app version
- `get_update_preferences` - Loads update settings
- `set_update_preferences` - Saves update settings
- `get_update_status` - Retrieves current update status
- `check_for_updates` - Checks for available updates
- `download_update` - Downloads pending update
- `quit_and_install` - Installs update and restarts

**Storage Commands (13)**
- `get_app_data_path` - Returns app data directory path
- `save_servers`/`load_servers` - Persist server configurations
- `save_chat_sessions`/`load_chat_sessions` - Persist chat history
- `save_settings`/`load_settings` - Persist app settings
- `save_connection_history`/`load_connection_history` - Connection tracking
- `save_backup`/`load_backup`/`delete_backup`/`list_backups` - Backup management
- `clear_all_data` - Factory reset
- `save_installation_metadata`/`load_installation_metadata` - Installation tracking

**File Dialog Commands (10)**
- `open_file_dialog` - Single file selection
- `open_files_dialog` - Multiple file selection
- `save_file_dialog` - Save file with default name
- `open_folder_dialog` - Folder selection
- `read_file`/`write_file` - Text file operations
- `read_file_binary`/`write_file_binary` - Binary file operations
- `file_exists` - File existence check
- `get_file_metadata` - File properties

**Secure Storage Commands (8)**
- `save_credential`/`get_credential`/`delete_credential`/`has_credential` - Generic credentials
- `save_oauth_token`/`get_oauth_token`/`delete_oauth_token` - OAuth token management
- `save_api_key`/`get_api_key`/`delete_api_key` - API key management
- `save_encrypted_data`/`get_encrypted_data`/`delete_encrypted_data` - Generic encryption
- `clear_all_credentials` - Reset keyring

**MCP Lifecycle Commands (5)**
- `mcp_start_server` - Spawn stdio process with configuration
- `mcp_stop_server` - Terminate process gracefully or forcefully
- `mcp_restart_server` - Stop and restart server
- `mcp_get_status` - Check process state and uptime
- `mcp_list_running` - List all running processes

**MCP Installer Commands (7)**
- `validate_install` - Check installation prerequisites
- `install_server` - Begin background installation
- `get_install_progress` - Poll installation progress
- `cancel_install` - Cancel in-progress installation
- `cleanup_install` - Remove progress tracking
- `get_installation_metadata` - Retrieve installation info
- `uninstall_server` - Uninstall with source-specific cleanup

**MCP Registry Commands (4)**
- `registry_search` - Search with filters, pagination, sorting
- `registry_categories` - Get available category tags
- `registry_popular` - Get top servers by downloads/stars
- `registry_refresh` - Update local cache from npm/GitHub

### Configuration Structure Analysis

**JSON-Based Persistence Model:**
- All data stored as JSON strings in platform-specific app data directory
- Separate files for different data types (servers.json, settings.json, etc.)
- Backups stored in subdirectory with UUID-based filenames
- Installation metadata persisted to disk with automatic loading on startup

**Configuration Types:**
1. **Server Configuration** (3 transport types)
   - Stdio: Local process with command, args, environment, working directory
   - SSE: Remote server with URL, optional separate SSE/POST endpoints
   - HTTP: Remote server with URL, method (GET/POST), timeout

2. **Installation Configuration** (3 sources)
   - NPM: Package name, optional version, custom registry
   - GitHub: Repository (owner/repo), optional branch/tag/commit/subpath
   - Local: File system path with validation option

3. **Process Lifecycle** (6 states)
   - Stopped → Starting → Running (or Restarting)
   - Running → Stopping → Stopped
   - Any state → Error

### IDE Client Support Gaps

**Missing IDE Integration Features:**
1. **No IDE Configuration Import/Export** - Cannot import Claude Desktop, VSCode, Cline configs
2. **No Config Format Conversion** - No utilities to convert between IDE formats and MCP Hub format
3. **No Config Validation Schema** - InstallConfig enum validated at runtime only
4. **No Client-Type Distinction** - Configuration doesn't indicate which IDE installed it
5. **No Config Merge/Conflict Resolution** - No handling for server configs defined in multiple IDEs
6. **No Auto-Discovery of IDE Configs** - Manual path entry required

**Supported Installation Sources vs. IDE Needs:**
- IDE configs often use npm packages → Supported ✓
- IDE configs often use GitHub repos → Supported ✓
- IDE configs often use local paths → Supported ✓
- IDE configs require environment variables → Supported via StdioConfig.env ✓
- IDE configs need custom working directories → Supported via StdioConfig.cwd ✓

**What's Missing:**
- Metadata indicating source IDE (Claude Desktop, VSCode, Cline, Custom)
- Config schema validation for IDE-specific requirements
- Automatic config discovery from IDE installation paths
- Config synchronization across multiple IDEs

### Custom Client Type Support

**Current Extensibility:**
The system uses a rigid three-source model (npm, github, local) with tagged enums. Adding new client types would require:

1. **Enum Extension Required** - InstallConfig enum in mcp_installer.rs would need new variant
2. **Installation Handler Needed** - do_install() function needs new match arm
3. **Metadata Serialization** - InstallMetadata.source_type must handle new type string
4. **Validation Logic** - validate_install() command needs new branch

**To Support Custom Client Types:**
- Add field to MCPServerConfig for "clientType": "claude-desktop" | "vscode" | "cline" | "custom"
- Create separate table/file for "client_configs.json" mapping servers to their source client
- Add InstallConfig variant: CustomClient { name: String, config: serde_json::Value }
- Create generic validation that accepts custom config objects

### Cross-Platform File Path Handling

**Current Approach:**
- Paths stored as strings in JSON configuration
- PathBuf used for operations: PathBuf::from(string_path)
- Platform-specific separators handled by Rust PathBuf automatically

**Path Handling Locations:**
1. **Working Directory** (StdioConfig.cwd)
   - Passed directly to Command::current_dir(cwd)
   - Platform-native path interpretation

2. **Installation Paths** (InstallMetadata.install_path)
   - Stored as string
   - Used in path operations: join(), remove_dir_all()

3. **File Operations** (file_dialogs.rs)
   - Dialog returns platform paths
   - Converted to string via f.to_string()

**Platform-Specific Issues:**
- Windows backslashes vs. Unix forward slashes handled by PathBuf
- Path.join() creates platform-appropriate separators
- No explicit normalization or validation before storage
- No path escaping for JSON serialization (potential issue with quotes/backslashes)

**Gap: Path Validation**
- User can provide invalid paths (permissions, special characters)
- No validation in server creation
- Errors only occur at runtime when process starts/path accessed
- No cross-platform path normalization

### Installation Metadata Persistence

**Current System:**
- Metadata loaded from "installation_metadata.json" on app startup
- Stored in global OnceLock<Mutex<HashMap>> during runtime
- Persisted to disk after each install/uninstall via persist_metadata()
- Manual save/load in InstallationProgress tracking

**Metadata Content:**
```
server_id: String
install_id: String
source_type: "npm" | "github" | "local"
install_path: String
package_name: Option<String> (npm only)
repository: Option<String> (github only)
version: Option<String>
installed_at: String (RFC3339 timestamp)
```

**Gaps in Metadata:**
- No "client_type" field for IDE source tracking
- No installation configuration stored (original install args lost)
- No uninstall count or removal history
- No update tracking or version history
- No hash/checksum for integrity verification

