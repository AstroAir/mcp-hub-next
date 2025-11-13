# MCP Server Installation Workflow Analysis

## Investigation Purpose

This document analyzes the current implementation of the MCP server installation workflow in the Rust backend, including package manager support, progress tracking, error handling, and platform compatibility.

## Evidence: Installation Implementation

### Code Section: Installation Configuration Enum

**File:** `src-tauri/src/mcp_installer.rs`
**Lines:** 5-14
**Purpose:** Defines supported installation sources and their configuration options

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
```

**Key Details:**
- Three installation sources implemented: npm, GitHub, local
- NPM supports: version specification, global install, custom registry
- GitHub supports: branch, tag, commit, sub_path selection
- Local supports: path validation option

### Code Section: Installation Progress Tracking

**File:** `src-tauri/src/mcp_installer.rs`
**Lines:** 19-24
**Purpose:** Track installation progress with detailed status information

```rust
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
    pub logs: Option<Vec<String>>
}
```

**Key Details:**
- Progress percentage tracking (0-100)
- Status enum: Pending, Downloading, Installing, Configuring, Completed, Failed, Cancelled
- Step-based progress with current/total tracking
- Timestamps for start and completion
- Error message and log storage

### Code Section: NPM Installation Implementation

**File:** `src-tauri/src/mcp_installer.rs`
**Lines:** 97-113
**Purpose:** Install packages from npm registry

```rust
InstallConfig::Npm { package_name, version, global, registry } => {
    update(&install_id, |p| {
        p.status=InstallationStatus::Downloading;
        p.progress=10;
        p.message=format!("Downloading {}...", package_name);
        ...
    });
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let target = if global.unwrap_or(false) { dir.clone() } else {
        dir.join("mcp_servers").join("npm").join(package_name.replace("/","-"))
    };
    std::fs::create_dir_all(&target).map_err(|e| e.to_string())?;

    let mut args: Vec<String> = vec!["install".into(),
        if let Some(v)=version { format!("{}@{}", package_name, v) } else { package_name } ];
    if !global.unwrap_or(false) {
        args.push("--prefix".into());
        args.push(target.to_string_lossy().to_string());
    }
    ...
}
```

**Key Details:**
- Installs to `{app_data}/mcp_servers/npm/{package_name}`
- Supports version pinning via `package@version` syntax
- Global vs local installation modes
- Custom registry support via `--registry` flag
- Automatic directory creation

### Code Section: GitHub Installation Implementation

**File:** `src-tauri/src/mcp_installer.rs`
**Lines:** 115-134
**Purpose:** Clone repositories from GitHub

```rust
InstallConfig::GitHub { repository, branch, tag, commit:_, sub_path:_ } => {
    update(&install_id, |p| {
        p.status=InstallationStatus::Downloading;
        p.progress=10;
        p.message=format!("Cloning {}...", repository);
        ...
    });
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let target = dir.join("mcp_servers").join("github")
        .join(repository.split('/').next_back().unwrap_or("repo"));
    std::fs::create_dir_all(&target).map_err(|e| e.to_string())?;

    let mut args = vec!["clone".to_string(),
        format!("https://github.com/{}.git", repository),
        target.to_string_lossy().to_string(),
        "--depth".into(), "1".into()];
    if let Some(b) = branch { args.push("--branch".into()); args.push(b); }
    if let Some(t) = tag { args.push("--branch".into()); args.push(t); }
    ...
    // Best-effort npm install if package.json exists
    let pkg = target.join("package.json");
    if pkg.exists() { let _ = Command::new("npm").arg("install").current_dir(&target).status(); }
}
```

**Key Details:**
- Shallow clone with `--depth 1` for efficiency
- Installs to `{app_data}/mcp_servers/github/{repo_name}`
- Branch and tag support
- Automatic dependency installation if package.json exists
- Commit and sub_path options present but not fully implemented

### Code Section: Installation Validation

**File:** `src-tauri/src/mcp_installer.rs`
**Lines:** 38-65
**Purpose:** Pre-flight validation of installation configuration

```rust
#[tauri::command]
pub fn validate_install(config: InstallConfig) -> Result<InstallationValidation, String> {
    let mut res = InstallationValidation {
        valid: true, errors: vec![], warnings: vec![],
        dependencies: vec![], estimated_size: None, estimated_time: None
    };
    match &config {
        InstallConfig::Npm { package_name, .. } => {
            let re = regex::Regex::new(r"^(@[a-z0-9-~][a-z0-9-._~]*/)?[a-z0-9-~][a-z0-9-._~]*$").unwrap();
            if !re.is_match(package_name) {
                res.valid=false;
                res.errors.push("Invalid npm package name".into());
            }
            let npm = npm_available();
            if !npm {
                res.valid=false;
                res.errors.push("npm is not available on PATH".into());
            }
            ...
        }
    }
}
```

**Key Details:**
- Regex validation for npm package names
- Dependency availability checks (npm, git)
- Provides estimated size and time
- Returns structured validation result with errors/warnings

## Findings: Installation Workflow

### Implemented Features

1. **Package Manager Support (Complete)**
   - npm: Full support with version, global, registry options
   - GitHub: Clone with branch/tag selection, shallow clones
   - Local: Path validation and reference

2. **Progress Tracking (Complete)**
   - Percentage-based progress (0-100)
   - Multi-step tracking with current/total counts
   - Status lifecycle: pending → downloading → installing → configuring → completed
   - Real-time message updates
   - Error and log capture

3. **Error Handling (Complete)**
   - Pre-flight validation with detailed error messages
   - Background thread error reporting (as of rust-backend-improvements)
   - Mutex lock poisoning handled properly
   - Process exit status checking

4. **Platform Support (Complete)**
   - Cross-platform directory creation
   - Platform-agnostic command execution
   - Uses Tauri app_data_dir for consistent storage locations

5. **Installation Cancellation (Complete)**
   - `cancel_install()` command implemented
   - Updates progress status to "Cancelled"
   - Process killing not implemented (noted in documentation)

### Implementation Gaps

1. **Process Tracking Limitation**
   - Spawned npm/git processes are not tracked
   - `cancel_install()` only updates status, doesn't kill processes
   - No `INSTALL_PROCESSES` map to store process handles

2. **GitHub Advanced Features**
   - `commit` parameter accepted but not used
   - `sub_path` parameter accepted but not used
   - No monorepo sub-path support

3. **Additional Package Managers**
   - No pip support (Python packages)
   - No uvx support (uv-based Python tools)
   - No cargo support (Rust crates)
   - No go install support

4. **Installation Location Tracking**
   - No persistent mapping of install_id to installation directory
   - No metadata about what was installed where
   - Makes uninstallation challenging

## Registered Commands

**File:** `src-tauri/src/lib.rs`
**Lines:** 201-205

```rust
// MCP installer
mcp_installer::validate_install,
mcp_installer::install_server,
mcp_installer::get_install_progress,
mcp_installer::cancel_install,
mcp_installer::cleanup_install,
```

All installation-related commands are properly registered in the Tauri invoke handler.

## Frontend Integration

**File:** `lib/types/tauri.ts`
**Lines:** 180-185

```typescript
// MCP installer commands
validate_install: (args: { config: Record<string, unknown> }) => Promise<unknown>;
install_server: (args: { config: Record<string, unknown>; serverName: string; serverDescription?: string; autoStart?: boolean }) => Promise<unknown>;
get_install_progress: (args: { installId: string }) => Promise<unknown>;
cancel_install: (args: { installId: string }) => Promise<{ installId: string }>;
cleanup_install: (args: { installId: string }) => Promise<void>;
```

Frontend has type definitions for all installation commands, though types use `unknown` and `Record` instead of specific types.

## Overall Status

The MCP installation workflow is **substantially complete** for npm and GitHub sources, with proper validation, progress tracking, and error handling. Key missing features are:

1. Process cancellation (status update only, no process killing)
2. Additional package managers (pip, uvx, cargo, go)
3. GitHub commit/sub_path support
4. Installation metadata persistence
