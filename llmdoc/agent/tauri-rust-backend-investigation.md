# Tauri Rust Backend Comprehensive Investigation

## Part 1: Evidence and Architecture Overview

### File Structure

**Source Files Location:** `src-tauri/src/`

The Tauri backend consists of the following Rust modules:

1. **main.rs** (7 lines) - Entry point that prevents console window on Windows and calls the run function
2. **lib.rs** (181 lines) - Main library with Tauri builder setup and command registration
3. **updates.rs** (284 lines) - Update checking and installation management
4. **storage.rs** (227 lines) - Application data persistence (servers, sessions, settings)
5. **file_dialogs.rs** (230 lines) - File/folder picking and file I/O operations
6. **secure_storage.rs** (138 lines) - Keyring-based credential storage
7. **mcp_lifecycle.rs** (180 lines) - Process lifecycle management for stdio servers
8. **mcp_installer.rs** (152 lines) - Package installation from npm, GitHub, and local paths
9. **mcp_registry.rs** (138 lines) - MCP server registry search and caching
10. **build.rs** (4 lines) - Build script for Tauri

**Total Rust Code:** ~1,500 lines (excluding generated code and dependencies)

<CodeSection>

## Code Section: Module Architecture in lib.rs

**File:** `src-tauri/src/lib.rs`
**Lines:** 1-50
**Purpose:** Declares all modules and sets up the Tauri application builder

```rust
mod updates;
mod storage;
mod file_dialogs;
mod secure_storage;
mod mcp_lifecycle;
mod mcp_installer;
mod mcp_registry;

use updates::UpdateState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(UpdateState::default())
    .setup(|app| { ... })
    .invoke_handler(tauri::generate_handler![...])
    .run(tauri::generate_context!())
}
```

**Key Details:**

- All 7 modules are declared and exposed
- Application state management via `.manage(UpdateState::default())`
- Plugin initialization for desktop environment (updater, dialog, fs)
- Embedded Next.js server launch on port 34115 during setup
- Command handler registration for all Tauri commands

</CodeSection>

### Dependencies (from Cargo.toml)

**Core Tauri Framework:**
- `tauri = "2.9.0"` - Desktop framework
- `tauri-build = "2.5.0"` - Build script dependency
- `tauri-plugin-log = "2"` - Structured logging
- `tauri-plugin-updater = "2"` - Auto-update functionality
- `tauri-plugin-dialog = "2"` - File/folder dialogs
- `tauri-plugin-fs = "2"` - File system operations

**Data & Serialization:**
- `serde = "1.0"` with derive feature - Serialization/deserialization
- `serde_json = "1.0"` - JSON handling
- `chrono = "0.4"` with clock and serde - Date/time utilities

**System & Security:**
- `keyring = "3"` - System keyring access (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- `dirs = "5"` - Platform-specific paths (app data, home, etc.)

**Utilities:**
- `log = "0.4"` - Logging facade
- `regex = "1"` - Pattern matching
- `nanoid = "0.4"` - ID generation

**Platform Requirements:**
- Rust edition 2021 with minimum version 1.77.2

<CodeSection>

## Code Section: Next.js Server Launch

**File:** `src-tauri/src/lib.rs`
**Lines:** 32-106
**Purpose:** Embedded Node.js runtime launches Next.js server on startup

```rust
let port = std::env::var("TAURI_NEXT_PORT").unwrap_or_else(|_| "34115".to_string());
let resource_dir: PathBuf = app_handle.path().resource_dir()?;
let bundled_node = resource_dir.join("resources").join("node").join(node_name);
let server_js = resource_dir.join("resources").join("server.js");

let mut child = Command::new(&node_path)
  .arg(&server_js)
  .env("PORT", &port)
  .current_dir(&resource_dir)
  .spawn()?;

// Wait for port availability (200 attempts, ~20s total)
for _ in 0..200 {
  if TcpStream::connect(&addr).is_ok() { ready = true; break; }
  thread::sleep(Duration::from_millis(100));
}

// Open main window pointing to http://127.0.0.1:34115
let url = format!("http://{}", addr);
tauri::WebviewWindowBuilder::new(&app_handle, "main", tauri::WebviewUrl::External(url.parse()?))
  .title("mcp-hub-next")
  .build()?
```

**Key Details:**

- Spawns bundled Node.js or falls back to system `node` command
- Loads `server.js` launcher from bundled resources directory
- Port configurable via `TAURI_NEXT_PORT` environment variable (defaults to 34115)
- Active polling with 100ms intervals up to 20 seconds
- Window opens only after server responds on port
- Uses external URL pointing to localhost HTTP server

</CodeSection>

## Part 2: Module Analysis and Functionality

### Module 1: Updates (`updates.rs`)

**Purpose:** Manages application updates via tauri-plugin-updater

**Key Components:**

<CodeSection>

## Code Section: Update State and Preferences

**File:** `src-tauri/src/updates.rs`
**Lines:** 5-50
**Purpose:** Define update state structures and preferences

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdatePreferences {
    pub auto_download: bool,
    pub auto_install_on_app_quit: bool,
    pub channel: String,
    pub check_on_startup: bool,
    pub last_check_time: Option<u64>,
}

pub struct UpdateState {
    pub preferences: Mutex<UpdatePreferences>,
    pub status: Mutex<Option<UpdateStatus>>,
}
```

**Key Details:**

- State managed in memory with Mutex for thread safety
- Preferences stored as serializable struct with default values
- Last check time stored as Unix timestamp
- Status tracking with events: checking, available, downloaded, error, not-available

</CodeSection>

**Commands Exposed:**
1. `get_app_version` - Returns package version
2. `get_update_preferences` / `set_update_preferences` - Preference management
3. `get_update_status` - Current update state
4. `check_for_updates` - Async update check with auto-download support
5. `quit_and_install` - Install downloaded update and exit

**Behavior:**
- Emits update-status events to frontend
- Supports auto-download when enabled
- Downloads and installs updates via tauri-plugin-updater
- Updates last check time on every check attempt

---

### Module 2: Storage (`storage.rs`)

**Purpose:** Persistent application data management

**Key Components:**

<CodeSection>

## Code Section: Storage Pattern

**File:** `src-tauri/src/storage.rs`
**Lines:** 5-28
**Purpose:** Helper functions for data directory management

```rust
fn get_app_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))
}

fn ensure_app_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = get_app_data_dir(app)?;
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    Ok(dir)
}
```

**Key Details:**

- Delegates directory resolution to Tauri path manager
- Ensures directory exists before write operations
- Uses platform-specific app data locations (Windows: AppData\Local, macOS: Library/Application Support, Linux: .local/share)

</CodeSection>

**Data Files Stored:**
- `servers.json` - MCP server configurations
- `chat_sessions.json` - Conversation history
- `settings.json` - Application preferences
- `connection_history.json` - Recent connection logs
- `backups/{backup_id}.json` - Configuration backups

**Commands Exposed (17 total):**
- `get_app_data_path` - Returns app data directory path
- `save_servers`, `load_servers` - Server config persistence
- `save_chat_sessions`, `load_chat_sessions` - Chat history
- `save_settings`, `load_settings` - App settings
- `save_connection_history`, `load_connection_history` - Connection logs
- `save_backup`, `load_backup`, `delete_backup`, `list_backups` - Backup operations
- `clear_all_data` - Reset all stored data

**Behavior:**
- Returns empty defaults (empty array `[]` or object `{}`) if files don't exist
- JSON strings passed as parameters - no validation/parsing on Rust side
- Backup IDs used as filenames with `.json` extension
- Logs all save operations

---

### Module 3: File Dialogs (`file_dialogs.rs`)

**Purpose:** Native file system UI interactions

**Key Components:**

<CodeSection>

## Code Section: File Dialog Implementation

**File:** `src-tauri/src/file_dialogs.rs`
**Lines:** 13-37
**Purpose:** Open single file dialog with optional filters

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

- Uses tauri-plugin-dialog for native file pickers
- Returns absolute path as string or None if cancelled
- Supports file type filtering with custom names
- All operations are blocking (synchronous)

</CodeSection>

**Struct Definitions:**

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileFilter {
    pub name: String,
    pub extensions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub size: u64,
    pub is_file: bool,
    pub is_dir: bool,
    pub modified: Option<u64>,
    pub created: Option<u64>,
}
```

**Commands Exposed (10 total):**
- `open_file_dialog`, `open_files_dialog` - File selection
- `save_file_dialog` - File save dialog
- `open_folder_dialog` - Folder selection
- `read_file`, `write_file` - Text file I/O
- `read_file_binary`, `write_file_binary` - Binary file I/O
- `file_exists` - File existence check
- `get_file_metadata` - File properties (size, timestamps, type)
- `show_message_dialog` - Info/warning/error dialogs
- `show_confirm_dialog` - Yes/no confirmation dialogs

**Behavior:**
- No path validation - accepts any path string
- Direct std::fs operations (no sandboxing)
- Timestamps returned as seconds since Unix epoch
- Dialog kinds: info, warning, error

---

### Module 4: Secure Storage (`secure_storage.rs`)

**Purpose:** System-level credential and secret storage

**Key Components:**

<CodeSection>

## Code Section: Keyring-based Storage

**File:** `src-tauri/src/secure_storage.rs`
**Lines:** 1-30
**Purpose:** System keyring integration for secure storage

```rust
use keyring::Entry;

const SERVICE_NAME: &str = "com.tauri.mcp-hub";

#[tauri::command]
pub fn save_credential(key: String, value: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, &key)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;

    entry
        .set_password(&value)
        .map_err(|e| format!("Failed to save credential: {}", e))?;

    log::info!("Saved credential for key: {}", key);
    Ok(())
}

#[tauri::command]
pub fn get_credential(key: String) -> Result<Option<String>, String> {
    let entry = Entry::new(SERVICE_NAME, &key)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;

    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("Failed to get credential: {}", e)),
    }
}
```

**Key Details:**

- Uses platform-specific keyring systems:
  - Windows: Credential Manager
  - macOS: Keychain
  - Linux: Secret Service (requires daemon)
- All credentials namespaced under "com.tauri.mcp-hub"
- Handles NoEntry error gracefully (returns None instead of error)
- No encryption layer - relies on OS-level security

</CodeSection>

**Commands Exposed (12 total):**
- `save_credential`, `get_credential`, `delete_credential`, `has_credential` - Generic credential storage
- `save_oauth_token`, `get_oauth_token`, `delete_oauth_token` - OAuth token shortcuts
- `save_api_key`, `get_api_key`, `delete_api_key` - API key shortcuts
- `save_encrypted_data`, `get_encrypted_data`, `delete_encrypted_data` - Generic encryption shortcuts
- `clear_all_credentials` - **Destructive** - logs warning but has no actual implementation (keyring lacks bulk delete API)

**Behavior:**
- Keys prefixed: `oauth_token_{server_id}`, `api_key_{service}`, `encrypted_{key}`
- NoEntry errors treated as missing data (returns Ok(None))
- `clear_all_credentials` only logs warning and returns Ok - cannot actually delete all credentials due to keyring library limitations

---

### Module 5: MCP Lifecycle (`mcp_lifecycle.rs`)

**Purpose:** Process lifecycle management for stdio MCP servers

**Key Components:**

<CodeSection>

## Code Section: Process Lifecycle State Machine

**File:** `src-tauri/src/mcp_lifecycle.rs`
**Lines:** 1-60
**Purpose:** Define lifecycle states and process tracking

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPServerProcess {
    pub server_id: String,
    pub pid: Option<u32>,
    pub state: LifecycleState,
    pub started_at: Option<String>,
    pub stopped_at: Option<String>,
    pub restart_count: u32,
    pub last_error: Option<String>,
    pub memory_usage: Option<u64>,
    pub cpu_usage: Option<f32>,
    pub uptime: Option<u64>,
    pub output: Option<String>,
}

struct ProcEntry {
    child: Child,
    state: MCPServerProcess,
    started: SystemTime,
}

static PROCESSES: OnceLock<Mutex<HashMap<String, ProcEntry>>> = OnceLock::new();
```

**Key Details:**

- Global process registry using OnceLock with Mutex
- Thread-safe access to running processes
- Uptime tracked via SystemTime.elapsed()
- Memory/CPU fields present but not populated
- State transitions: Running → Stopping → Stopped

</CodeSection>

**Process Lifecycle:**

```rust
fn mcp_start_server(server_id: String, cfg: StdioConfig) -> Result<MCPServerProcess, String>
```
- Returns current state if already running
- Spawns Command with provided configuration
- Captures stdin/stdout/stderr as pipes
- Stores child process handle in global map
- Returns state with PID and start timestamp (ISO 8601 format)

```rust
fn mcp_stop_server(server_id: String, force: Option<bool>) -> Result<(), String>
```
- Graceful termination via SIGTERM on Unix (via nix crate)
- Force kill via kill() on Windows or when force=true
- Updates state to Stopped with timestamp
- Removes from process registry

```rust
fn mcp_restart_server(server_id: String, cfg: Option<StdioConfig>) -> Result<MCPServerProcess, String>
```
- Calls stop then start with 300ms sleep between
- Requires config parameter (cannot restart without new config)

```rust
fn mcp_get_status(server_id: String) -> Result<MCPServerProcess, String>
fn mcp_list_running() -> Result<Vec<MCPServerProcess>, String>
```
- Uses try_wait() to poll process status
- Updates state if process has exited (Running → Stopped/Error)
- Calculates uptime on each status check

**Struct Definition:**

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StdioConfig {
    pub command: String,
    #[serde(default)]
    pub args: Vec<String>,
    #[serde(default)]
    pub env: HashMap<String, String>,
    pub cwd: Option<String>,
}
```

**Commands Exposed (5 total):**
- `mcp_start_server` - Start stdio server with command/args/env
- `mcp_stop_server` - Graceful or force shutdown
- `mcp_restart_server` - Stop and start with delay
- `mcp_get_status` - Poll single server status
- `mcp_list_running` - Get all active processes

**Behavior:**
- Process stdout/stderr captured but not exposed to caller
- Exit code 0 = clean stop, non-zero = error state
- Timestamps in RFC3339 format (ISO 8601)
- No resource limits or monitoring (memory/CPU fields unused)

---

### Module 6: MCP Installer (`mcp_installer.rs`)

**Purpose:** Package installation orchestration (npm, GitHub, local)

**Key Components:**

<CodeSection>

## Code Section: Installation Configuration and Progress

**File:** `src-tauri/src/mcp_installer.rs`
**Lines:** 5-28
**Purpose:** Define installation sources and progress tracking

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "source")]
pub enum InstallConfig {
    #[serde(rename = "npm")]
    Npm { package_name: String, version: Option<String>, global: Option<bool>, registry: Option<String> },
    #[serde(rename = "github")]
    GitHub { repository: String, branch: Option<String>, tag: Option<String>, commit: Option<String>, sub_path: Option<String> },
    #[serde(rename = "local")]
    Local { path: String, validate: Option<bool> },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InstallationStatus { Pending, Downloading, Installing, Configuring, Completed, Failed, Cancelled }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallationProgress {
    pub install_id: String,
    pub status: InstallationStatus,
    pub progress: u8,
    pub message: String,
    pub current_step: Option<String>,
    pub total_steps: Option<u32>,
    pub current_step_number: Option<u32>,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub error: Option<String>,
    pub logs: Option<Vec<String>>,
}
```

**Key Details:**

- TaggedEnum pattern for different install sources
- Progress tracked as percentage (0-100)
- Step counter for multi-step installations
- Timestamps in RFC3339 format
- Global installation registry with Mutex

</CodeSection>

**Installation Flows:**

1. **NPM Installation:**
   - Validates package name with regex: `^(@[a-z0-9-~][a-z0-9-._~]*/)?[a-z0-9-~][a-z0-9-._~]*$`
   - Checks npm availability via `npm --version`
   - Installs to `{app_data}/mcp_servers/npm/{package_name}` or globally
   - Supports custom registry via `--registry` flag
   - Estimated size: 10 MB, time: 30s

2. **GitHub Installation:**
   - Validates repository format: `owner/repo`
   - Checks git availability
   - Clones with `--depth 1` (shallow clone)
   - Attempts `npm install` if package.json exists
   - Installs to `{app_data}/mcp_servers/github/{repo_name}`
   - Estimated size: 50 MB, time: 60s

3. **Local Installation:**
   - Validates path exists and is directory
   - No actual file operations - just configuration
   - Estimated size: 0 B, time: 1s

**Commands Exposed (5 total):**
- `validate_install` - Pre-flight checks and validation
- `install_server` - Async installation with background thread
- `get_install_progress` - Poll installation status
- `cancel_install` - Mark installation as cancelled
- `cleanup_install` - Remove progress tracking entry

**Behavior:**
- Installations run in background threads (spawned by install_server)
- Progress updated via closure callbacks in global map
- Process calls via Command (npm, git)
- Errors set in progress object
- No package manager output captured

---

### Module 7: MCP Registry (`mcp_registry.rs`)

**Purpose:** MCP server discovery and registry management

**Key Components:**

<CodeSection>

## Code Section: Registry Cache and Search

**File:** `src-tauri/src/mcp_registry.rs`
**Lines:** 29-50
**Purpose:** Known servers and registry cache management

```rust
static CACHE: OnceLock<Mutex<Vec<RegistryServerEntry>>> = OnceLock::new();
fn cache() -> &'static Mutex<Vec<RegistryServerEntry>> {
    CACHE.get_or_init(|| Mutex::new(vec![]))
}

fn known_servers() -> Vec<RegistryServerEntry> {
    let known = [
        "@modelcontextprotocol/server-filesystem",
        "@modelcontextprotocol/server-github",
        "@modelcontextprotocol/server-postgres",
        "@modelcontextprotocol/server-sqlite",
        "@modelcontextprotocol/server-slack",
        "@modelcontextprotocol/server-brave-search",
        "@modelcontextprotocol/server-puppeteer",
        "@modelcontextprotocol/server-memory",
        "@modelcontextprotocol/server-fetch",
        "@modelcontextprotocol/server-google-maps",
    ];
    known.iter().map(|pkg| {
        // Convert "@modelcontextprotocol/server-{name}" → name
        // Build RegistryServerEntry with homepage and docs links
    }).collect()
}
```

**Key Details:**

- 10 hard-coded official MCP servers from @modelcontextprotocol
- Cache loaded on first search
- Verified flag set for official servers only
- Deduplication by ID before caching

</CodeSection>

**Registry Search Implementation:**

```rust
fn search_npm(query: Option<&str>) -> Vec<RegistryServerEntry>
```
- Executes `npm search {query} --json --long`
- Filters results for MCP-related packages (name or keywords contain "mcp")
- Parses JSON response and extracts metadata
- Marks as verified if in known_servers list
- Falls back to "mcp-server" query if no query provided

**Registry Entry Structure:**

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
```

**Commands Exposed (4 total):**
- `registry_search` - Search with filters and pagination
- `registry_categories` - Get all unique tags
- `registry_popular` - Get top servers by download count
- `registry_refresh` - Force cache update

**Search Filters:**

```rust
pub struct RegistrySearchFilters {
    pub query: Option<String>,
    pub source: Option<String>,        // "npm", "github", "local"
    pub tags: Option<Vec<String>>,
    pub verified: Option<bool>,
    pub sort_by: Option<String>,       // "downloads", "stars", "updated", or name
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}
```

**Behavior:**
- Returns (results, total_count, has_more) tuple
- Default limit: 20, offset: 0
- Case-insensitive search on name, description, tags
- Source filtering via InstallationSource enum matching
- Sort defaults to name if not specified
- Cache auto-populates on first search
- TODO comment indicates GitHub search not yet implemented

---

## Part 3: Testing Infrastructure and Observations

### Existing Tests
- **No existing tests found** - Zero `#[cfg(test)]` blocks in any Rust files
- **No tests directory** - No `src-tauri/tests/` or `src-tauri/src/tests/` directories
- **Cargo config** - No test configuration in Cargo.toml

### Current State of Module Coverage
1. **updates.rs** - No test blocks, no mocking of tauri-plugin-updater
2. **storage.rs** - No test blocks, direct fs operations
3. **file_dialogs.rs** - No test blocks, direct UI operations
4. **secure_storage.rs** - No test blocks, direct keyring access
5. **mcp_lifecycle.rs** - No test blocks, global process registry
6. **mcp_installer.rs** - No test blocks, spawns external processes
7. **mcp_registry.rs** - No test blocks, executes npm commands
8. **lib.rs** - No test blocks, Tauri initialization

### Testing Challenges Identified

1. **Global State Management:**
   - `mcp_lifecycle.rs` uses OnceLock static for process map
   - `mcp_installer.rs` uses OnceLock static for installation progress
   - `mcp_registry.rs` uses OnceLock static for cache
   - Tests cannot be run in parallel or reset state between runs

2. **External Dependencies:**
   - Keyring system access (no mock available)
   - File system I/O (requires temp directories)
   - Process spawning (npm, git, node commands)
   - Tauri plugins (updater, dialog, fs)

3. **Async/Concurrency:**
   - Several commands marked `async` but use blocking operations
   - Mutex poisoning possible on panic
   - No timeout mechanisms for spawned processes

4. **Platform-Specific Code:**
   - mcp_lifecycle uses nix crate for Unix-specific signal handling
   - Conditional compilation for Windows vs Unix
   - File path handling varies by OS

### Mock/Test Support Currently Available
- **None** - No existing test utilities, fixtures, or helpers
- **No mock crates** in dependencies (no mockall, mocktopus, etc.)
- **No test-only dependencies** in Cargo.toml

### Recommended Testing Approach

**Unit Testing Candidates:**
- Input validation (regex patterns, package name formats)
- State machine transitions (lifecycle states)
- Data structure serialization/deserialization
- Filter/search logic (registry)

**Integration Testing Candidates:**
- Tauri command invocation (mock response)
- Process management with tempfiles
- File operations with temporary directories
- Storage persistence (use test app_data_dir)

**Not Easily Testable Without Refactoring:**
- Keyring operations (requires system setup)
- External process spawning (requires npm/git/node)
- Tauri-plugin operations (requires Tauri test framework)

