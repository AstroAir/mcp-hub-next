# Tauri Command Architecture and Implementation Patterns

## Evidence Section

<CodeSection>

## Code Section: Tauri Application Initialization

**File:** `src-tauri/src/lib.rs`
**Lines:** 13-159
**Purpose:** Main Tauri app setup with command registration and plugin initialization

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(UpdateState::default())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(tauri_plugin_log::Builder::default()
          .level(log::LevelFilter::Info)
          .build())?;
      }

      #[cfg(desktop)]
      {
        app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
        app.handle().plugin(tauri_plugin_dialog::init())?;
        app.handle().plugin(tauri_plugin_fs::init())?;

        // Load installation metadata on startup
        let app_handle_for_metadata = app.handle().clone();
        tauri::async_runtime::spawn(async move {
          match storage::load_installation_metadata(app_handle_for_metadata) {
            Ok(json) if !json.is_empty() && json != "[]" => {
              if let Ok(metadata_vec) = serde_json::from_str::<Vec<mcp_installer::InstallMetadata>>(&json) {
                if let Ok(mut meta_map) = mcp_installer::install_metadata().lock() {
                  for metadata in metadata_vec {
                    meta_map.insert(metadata.install_id.clone(), metadata);
                  }
                }
              }
            }
          }
        });
      }

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![/* 32 commands */])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

**Key Details:**

- App manages UpdateState for update tracking
- Plugins initialized for desktop platform only
- Installation metadata loaded asynchronously on startup into global static map
- Commands registered via generate_handler! macro
- Both desktop-only (Windows/macOS/Linux) and mobile entries supported

</CodeSection>

<CodeSection>

## Code Section: Storage Command Pattern

**File:** `src-tauri/src/storage.rs`
**Lines:** 20-54
**Purpose:** Persistent storage command implementation pattern

```rust
#[tauri::command]
pub fn get_app_data_path(app: AppHandle) -> Result<String, String> {
    let dir = get_app_data_dir(&app)?;
    dir.to_str()
        .ok_or_else(|| "Invalid path".to_string())
        .map(|s| s.to_string())
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

- All commands take AppHandle to access app context
- Return Result<T, String> with error messages
- AppHandle methods used: path().app_data_dir()
- Validation: path.to_str() conversion (handles invalid Unicode paths)
- JSON strings passed as-is (no deserialization in Rust)
- Logging via log:: macros at info level
- Empty file returns default "[]" or "{}"

</CodeSection>

<CodeSection>

## Code Section: Async File Dialog Commands

**File:** `src-tauri/src/file_dialogs.rs`
**Lines:** 13-68
**Purpose:** Async native file dialog integration pattern

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
            let extensions: Vec<&str> = filter.extensions
                .iter()
                .map(|s| s.as_str())
                .collect();
            builder = builder.add_filter(&filter.name, &extensions);
        }
    }

    let file = builder.blocking_pick_file();
    Ok(file.map(|f| f.to_string()))
}
```

**Key Details:**

- Async function signature despite blocking operations inside
- Uses builder pattern via app.dialog().file()
- Filters constructed inline from Vec<FileFilter>
- Returns Option<String> (None if user cancels)
- blocking_pick_file() used despite async context
- Path converted to string via f.to_string() (which calls Display impl)

</CodeSection>

<CodeSection>

## Code Section: Process Lifecycle Commands

**File:** `src-tauri/src/mcp_lifecycle.rs`
**Lines:** 63-180
**Purpose:** Process spawning and lifecycle management pattern

```rust
#[tauri::command]
pub fn mcp_start_server(server_id: String, cfg: StdioConfig) -> Result<MCPServerProcess, String> {
    // Check if already running
    if let Ok(state) = mcp_get_status(server_id.clone()) {
        if state.state == LifecycleState::Running {
            return Ok(state);
        }
    }

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
    cmd.stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let child = cmd.spawn()
        .map_err(|e| format!("Failed to start process: {e}"))?;
    let pid_val = child.id();

    let process = MCPServerProcess {
        server_id: server_id.clone(),
        pid: Some(pid_val),
        state: LifecycleState::Running,
        started_at: Some(now_iso()),
        stopped_at: None,
        restart_count: 0,
        last_error: None,
        memory_usage: None,
        cpu_usage: None,
        uptime: Some(0),
        output: None,
    };

    let entry = ProcEntry {
        child,
        state: process.clone(),
        started: SystemTime::now()
    };

    processes()
        .lock()
        .map_err(|_| "Lock poisoned")?
        .insert(server_id, entry);

    Ok(process)
}
```

**Key Details:**

- Idempotent: checks if already running, returns existing state
- Command builder pattern for flexible argument application
- Pipes stdin/stdout/stderr for potential future communication
- Process stored in global OnceLock<Mutex> map
- Lock poisoning errors possible (theoretical, not practical)
- Returns serializable MCPServerProcess struct
- SystemTime::now() for uptime tracking

</CodeSection>

<CodeSection>

## Code Section: Background Installation Pattern

**File:** `src-tauri/src/mcp_installer.rs`
**Lines:** 84-107
**Purpose:** Async background task spawning pattern

```rust
#[tauri::command]
pub fn install_server(
    app: AppHandle,
    config: InstallConfig,
    _server_name: String,
    _server_description: Option<String>
) -> Result<(String, InstallationProgress), String> {
    let install_id = nanoid::nanoid!();

    let progress = InstallationProgress {
        install_id: install_id.clone(),
        status: InstallationStatus::Pending,
        progress: 0,
        message: "Preparing installation".into(),
        current_step: None,
        total_steps: None,
        current_step_number: None,
        started_at: now_iso(),
        completed_at: None,
        error: None,
        logs: Some(vec![]),
    };

    installs()
        .lock()
        .map_err(|_| "Lock poisoned")?
        .insert(install_id.clone(), progress.clone());

    // Spawn background thread to perform install
    let id_for_thread = install_id.clone();
    std::thread::spawn(move || {
        if let Err(e) = do_install(app, id_for_thread.clone(), config) {
            log::error!("Installation {} failed: {}", id_for_thread, e);
            update(&id_for_thread, |p| {
                p.status = InstallationStatus::Failed;
                p.progress = 0;
                p.message = format!("Installation failed: {}", e);
                p.error = Some(e.clone());
                p.completed_at = Some(now_iso());
            });
        }
    });

    let current = installs()
        .lock()
        .unwrap()
        .get(&install_id)
        .cloned()
        .unwrap();

    Ok((install_id, current))
}

fn update(install_id: &str, patch: impl FnOnce(&mut InstallationProgress)) {
    if let Ok(mut map) = installs().lock() {
        if let Some(p) = map.get_mut(install_id) {
            patch(p);
        }
    }
}
```

**Key Details:**

- Command returns immediately with install_id for polling
- Background thread spawned via std::thread::spawn
- Progress stored in global OnceLock<Mutex<HashMap>>
- update() helper provides closure-based mutation pattern
- Thread captures AppHandle by move (requires Clone)
- Error logging occurs in background thread
- Progress retrieved via separate get_install_progress command

</CodeSection>

<CodeSection>

## Code Section: Registry Search with Pagination

**File:** `src-tauri/src/mcp_registry.rs`
**Lines:** 167-182
**Purpose:** Search with filtering, sorting, and pagination pattern

```rust
#[tauri::command]
pub fn registry_search(filters: RegistrySearchFilters) -> Result<(Vec<RegistryServerEntry>, u32, bool), String> {
    if cache()
        .lock()
        .map_err(|_| "Cache lock poisoned")?
        .is_empty() {
        update_cache()?;
    }

    let mut results = cache()
        .lock()
        .map_err(|_| "Cache lock poisoned")?
        .clone();

    // Filter by query
    if let Some(q) = &filters.query {
        let q = q.to_lowercase();
        results.retain(|s|
            s.name.to_lowercase().contains(&q)
            || s.description.to_lowercase().contains(&q)
            || s.tags.as_ref()
                .map(|t| t.iter().any(|x| x.to_lowercase().contains(&q)))
                .unwrap_or(false)
        );
    }

    // Filter by source
    if let Some(src) = &filters.source {
        results.retain(|s|
            matches!((src.as_str(), &s.source),
                ("npm", InstallationSource::Npm)
                | ("github", InstallationSource::Github)
                | ("local", InstallationSource::Local)
            )
        );
    }

    // Filter by verified
    if let Some(v) = filters.verified {
        results.retain(|s| s.verified.unwrap_or(false) == v);
    }

    // Sort
    if let Some(sort) = &filters.sort_by {
        match sort.as_str() {
            "downloads" => results.sort_by_key(|s| std::cmp::Reverse(s.downloads.unwrap_or(0))),
            "stars" => results.sort_by_key(|s| std::cmp::Reverse(s.stars.unwrap_or(0))),
            "updated" => results.sort_by_key(|s| std::cmp::Reverse(s.last_updated.clone().unwrap_or_default())),
            _ => results.sort_by(|a, b| a.name.cmp(&b.name)),
        }
    } else {
        results.sort_by(|a, b| a.name.cmp(&b.name));
    }

    // Paginate
    let total = results.len() as u32;
    let offset = filters.offset.unwrap_or(0) as usize;
    let limit = filters.limit.unwrap_or(20) as usize;
    let slice = if offset < results.len() {
        let end = (offset + limit).min(results.len());
        results[offset..end].to_vec()
    } else {
        vec![]
    };
    let has_more = (offset + limit) < (total as usize);

    Ok((slice, total, has_more))
}
```

**Key Details:**

- In-memory cache with lazy loading
- Multi-stage pipeline: filter → sort → paginate
- Retain operations for filtering with complex predicates
- Case-insensitive text search
- Sort uses std::cmp::Reverse for descending order
- Pagination with has_more flag for pagination UI
- Returns tuple: (results, total_count, has_more)

</CodeSection>

<CodeSection>

## Code Section: Secure Storage with Registry

**File:** `src-tauri/src/secure_storage.rs`
**Lines:** 47-78
**Purpose:** Keyring-based credential storage with registry tracking

```rust
#[tauri::command]
pub fn save_credential(key: String, value: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, &key)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;

    entry
        .set_password(&value)
        .map_err(|e| format!("Failed to save credential: {}", e))?;

    // Add to registry for tracking
    if let Err(e) = add_to_registry(&key) {
        log::warn!("Failed to add credential to registry: {}", e);
        // Don't fail the operation if registry update fails
    }

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

#[tauri::command]
pub fn delete_credential(key: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, &key)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;

    match entry.delete_credential() {
        Ok(_) => {
            if let Err(e) = remove_from_registry(&key) {
                log::warn!("Failed to remove credential from registry: {}", e);
            }
            log::info!("Deleted credential for key: {}", key);
            Ok(())
        }
        Err(keyring::Error::NoEntry) => {
            let _ = remove_from_registry(&key);
            Ok(())
        }
        Err(e) => Err(format!("Failed to delete credential: {}", e)),
    }
}
```

**Key Details:**

- keyring::Entry created per-key for credential operations
- SERVICE_NAME constant used for app identification
- Registry tracking separate metadata in keyring
- delete_credential idempotent (succeeds even if key missing)
- Registry update failures logged but don't fail operations
- NoEntry error handled gracefully as non-failure case

</CodeSection>

## Findings Section

### Command Architecture Patterns

**Five Distinct Command Patterns Identified:**

1. **Simple Query Commands**
   - No side effects (get_app_version, get_update_status)
   - Return Result<T, String> directly
   - Example: `get_app_version() -> Result<String, String>`

2. **Storage Commands with AppHandle**
   - Require app context for path resolution
   - Take JSON strings or primitives, return Result
   - Example: `save_servers(app: AppHandle, servers: String) -> Result<(), String>`

3. **Async File Dialog Commands**
   - Async function signature but blocking implementation
   - Use tauri_plugin_dialog builder pattern
   - Return Option<T> for user cancellation
   - Example: `open_file_dialog(app: AppHandle, ...) -> Result<Option<String>, String>`

4. **Background Task Commands**
   - Spawn std::thread for long-running operations
   - Return immediately with task ID/progress
   - Use global static maps for progress tracking
   - Implement polling via separate get_progress command
   - Example: `install_server(...) -> Result<(String, InstallationProgress), String>`

5. **Process Lifecycle Commands**
   - Manage external subprocess state
   - Store processes in global OnceLock<Mutex> maps
   - Return serializable process state structs
   - Example: `mcp_start_server(id: String, cfg: StdioConfig) -> Result<MCPServerProcess, String>`

### Global State Management

**Three Global Static Structures:**

1. **UpdateState** (managed via Builder)
   - Single instance managed by Tauri
   - Accessed via app.state::<UpdateState>()

2. **Process Map** (OnceLock<Mutex<HashMap>>)
   - In mcp_lifecycle.rs: PROCESSES
   - Maps server_id → ProcEntry (contains Child and MCPServerProcess)
   - Used by mcp_start_server, mcp_stop_server, mcp_get_status, mcp_list_running

3. **Installation Maps** (OnceLock<Mutex<HashMap>>)
   - INSTALLS: install_id → InstallationProgress
   - INSTALL_METADATA: install_id → InstallMetadata
   - INSTALL_PROCESSES: install_id → Child (for cancellation)

**Synchronization Pattern:**
- Lock poisoning errors returned as errors (never panic)
- Closures used for atomic mutations (update pattern)
- Clones avoided where possible (ownership transfer)
- All operations fallible due to lock acquisition

### Error Handling Conventions

**Consistent Error Type:** Result<T, String>
- All Tauri commands return Result<T, String>
- Error messages formatted with context
- No error codes or structured errors

**Error Propagation:**
- Uses ? operator for early return
- Maps foreign errors via map_err()
- Log::error!() called in error paths

**Graceful Degradation:**
- Registry update failures logged but don't fail operations
- Process stop failures ignored in uninstall
- npm uninstall failures fallback to directory deletion

### Communication Between Modules

**Inter-Module Command Calls:**

1. **uninstall_server calls mcp_lifecycle::mcp_stop_server**
   ```rust
   let _ = crate::mcp_lifecycle::mcp_stop_server(sid.clone(), Some(false));
   ```
   - Via crate:: path resolution
   - Errors ignored intentionally

2. **lib.rs calls storage::load_installation_metadata**
   ```rust
   match storage::load_installation_metadata(app_handle_for_metadata)
   ```
   - Called during app initialization
   - Populates global mcp_installer::install_metadata() map

3. **install_server calls persist_metadata**
   ```rust
   persist_metadata(&app);
   ```
   - persist_metadata spawns thread to call storage::save_installation_metadata
   - Async notification pattern

### Serialization/Deserialization

**Pattern: JSON Strings, Not Bytes**
- Frontend sends JSON as String
- Backend stores/loads as String
- No serde deserialization in Tauri commands

**Why This Design:**
- Backwards compatible with any JSON structure
- Flexible for different config schemas
- Frontend handles validation/schema
- No type brittleness on breaking changes

**Trade-off:**
- Cannot validate on Rust side
- Potential for corrupted data
- Requires frontend/backend schema synchronization

### Extensibility Points

**1. Command Registration**
- Location: src-tauri/src/lib.rs invoke_handler!
- Process: Add command to generate_handler! array
- Existing commands: 32, organized by module

**2. Module Creation Pattern**
- Create file: src-tauri/src/new_module.rs
- Define public #[tauri::command] functions
- Declare mod new_module in lib.rs
- Add to invoke_handler!

**3. Global State Addition**
- Create OnceLock<Mutex<T>>
- Create accessor function
- Access via .lock().map_err(...)?
- Initialize or populate on app setup

**4. Type Extension**
- Modify lib/types/mcp.ts or lib/types/tauri.ts
- Use serde tagged enums for extensibility
- Support Option<T> for optional fields
- Document serialization format

### Plugin Integration

**Loaded Desktop Plugins:**

1. **tauri_plugin_updater** - Auto-update functionality
2. **tauri_plugin_dialog** - Native file dialogs
3. **tauri_plugin_fs** - File system operations
4. **tauri_plugin_log** - Debug logging (debug builds only)

**Plugin Usage Pattern:**
- App.handle().plugin(Builder.build())?
- Each plugin provides trait extensions via use statements
- Example: tauri_plugin_dialog::DialogExt trait

**Extension Capability:**
- Can add more plugins in setup()
- Plugin registration order matters
- Each plugin initialized conditionally (#[cfg(desktop)])

