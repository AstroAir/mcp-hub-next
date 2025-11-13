# Tauri Rust Backend Testing Infrastructure

## 1. Purpose

The Rust backend (`src-tauri/`) implements MCP server lifecycle management, file I/O, secure credential storage, and marketplace/registry operations. Comprehensive unit tests validate input handling, state transitions, serialization, and dependency checks across six core modules. All 78 tests pass without warnings, ensuring production stability before deployment.

## 2. Test Infrastructure

### Dependencies

Test dependencies in `src-tauri/Cargo.toml`:
- **tempfile 3.13**: Create temporary directories/files for file I/O testing
- **mockall 0.13**: Mock infrastructure (reserved for future use)
- **serial_test 3.1**: Serialize tests accessing shared global state (prevents race conditions)
- **tokio 1.40**: Async runtime for running async Tauri commands in tests

### Running Tests

```bash
# Run all unit tests
cargo test --lib

# Run tests for a specific module
cargo test --lib mcp_installer

# Run with output (useful for debugging)
cargo test --lib -- --nocapture

# Run single test
cargo test --lib test_validate_npm_package_names

# Check code quality
cargo clippy --all-targets

# Build and verify compilation
cargo build
```

Test results: **78 tests passing**, zero clippy warnings.

### Test Organization

All tests are colocated with source code in `#[cfg(test)] mod tests` blocks at the end of each module:
- `src-tauri/src/mcp_installer.rs` - 14 tests
- `src-tauri/src/mcp_registry.rs` - 17 tests
- `src-tauri/src/mcp_lifecycle.rs` - 13 tests
- `src-tauri/src/file_dialogs.rs` - 13 tests
- `src-tauri/src/secure_storage.rs` - 12 tests (4 new for credential registry)
- `src-tauri/src/updates.rs` - 11 tests
- `src-tauri/src/storage.rs` - 18 tests

## 3. Module Coverage

### mcp_installer.rs (14 tests)

Validates MCP server installation configurations and progress tracking.

**Key test areas:**
- **NPM package name validation**: Valid unscoped (`express`) and scoped (`@scope/package`) packages, rejection of uppercase/invalid characters
- **GitHub repository format**: Valid `owner/repo` format, rejection of malformed paths
- **Local path validation**: Existing directories pass, non-existent paths fail
- **Installation estimates**: NPM (10 MB, 30s), GitHub (50 MB, 60s), Local (0 MB, 1s)
- **Serialization**: InstallConfig enum variants (Npm/GitHub/Local) and InstallationStatus lifecycle
- **Timestamp generation**: RFC3339 ISO format validation via `now_iso()`
- **Dependency checks**: npm/git availability detection

**Key data structures:**
- `InstallConfig`: Enum with three variants (Npm, GitHub, Local)
- `InstallationProgress`: Tracks install state, progress %, steps, timestamps, errors
- `InstallationValidation`: Reports validation errors, warnings, dependencies, estimates

### mcp_registry.rs (17 tests)

Manages MCP server registry, search, filtering, and marketplace discovery.

**Key test areas:**
- **Known servers**: 10 official MCP servers (filesystem, github, postgres, sqlite, slack, etc.)
- **Server properties**: Verification status, NPM source, documentation links, tags
- **Search functionality**: Query filtering by name/description/tags, source filtering (npm/github/local)
- **Pagination**: Limit/offset handling, non-overlapping pages, has_more flag
- **Filtering**: Verified-only flag, case-insensitive search
- **Categories**: Extraction from server tags, sorted alphabetically
- **Popular servers**: Sorting by downloads
- **Serialization**: RegistryServerEntry, InstallationSource enum, search filters

**Key data structures:**
- `RegistryServerEntry`: Full server metadata (id, name, source, version, tags, downloads, stars, verified flag)
- `RegistrySearchFilters`: Query, source, tags, verified flag, sort_by, limit, offset
- Static cache mechanism with `OnceLock<Mutex<Vec<...>>>`

### mcp_lifecycle.rs (13 tests)

Manages stdio MCP server process lifecycle: start, stop, restart, state transitions.

**Key test areas:**
- **State transitions**: Stopped → Starting → Running → Stopping → Stopped
- **Process serialization**: MCPServerProcess struct with pid, timestamps, restart count, error handling
- **StdioConfig validation**: Command, args, environment variables, working directory
- **Timestamp generation**: ISO format for started_at/stopped_at
- **Process status tracking**: PID, state, uptime, restart count, last error

**Key data structures:**
- `MCPServerProcess`: Complete process state (server_id, pid, state, timestamps, memory, CPU, uptime, output)
- `LifecycleState`: Enum (Stopped, Starting, Running, Stopping, Restarting, Error)
- `StdioConfig`: Command execution parameters (command, args, env HashMap, cwd)
- Static process registry with `OnceLock<Mutex<HashMap<String, ProcEntry>>>`

### file_dialogs.rs (13 tests)

File I/O operations: reading, writing, metadata extraction, UTF-8 handling with temporary files.

**Key test areas:**
- **File creation**: Using tempfile crate for isolated testing
- **Metadata extraction**: File size, creation/modification times
- **Binary I/O**: Read/write operations without data loss
- **Text I/O**: UTF-8 validation and encoding
- **Error handling**: Missing files, permission issues, invalid encodings
- **Dialog serialization**: FileFilter struct (name, extensions)

**Data structures:**
- `FileFilter`: Dialog filter definition (name, extensions)
- File operations are async Tauri commands (`#[tauri::command]`)

### secure_storage.rs (12 tests)

System keyring integration for OAuth tokens and credentials using Keyring crate with credential registry tracking.

**Key test areas:**
- **Key formatting**: Service name prefix (`com.tauri.mcp-hub`), key construction
- **Keyring entry creation**: Proper Entry instantiation
- **Credential lifecycle**: Save, retrieve, delete, existence check
- **OAuth token handling**: Dedicated methods with token key prefixing
- **Credential registry**: Tracking system for all stored credentials (NEW)
- **Registry operations**: Empty registry, registry functions existence (NEW)
- **Error handling**: Missing entries, permission errors

**Key functions:**
- `save_credential(key, value)`: Store in system keyring (now adds to registry)
- `get_credential(key)`: Retrieve from keyring or None
- `delete_credential(key)`: Remove from keyring (now removes from registry)
- `has_credential(key)`: Check existence
- `save_oauth_token(server_id, token)`: Prefixed credential save
- `get_oauth_token(server_id)`: Prefixed credential retrieval
- `clear_all_credentials()`: Delete all credentials using registry (NOW FUNCTIONAL)
- `get_credential_registry()`: Retrieve list of all credential keys (NEW)
- `add_to_registry(key)`: Add key to tracking registry (NEW)
- `remove_from_registry(key)`: Remove key from tracking registry (NEW)

### updates.rs (11 tests)

Application update management with preferences and status tracking.

**Key test areas:**
- **Update preferences**: Auto-download, auto-install on quit, channel (stable/beta), startup check
- **Preferences serialization**: camelCase conversion (auto_download → autoDownload)
- **Status structures**: Event type, optional data field, update_downloaded flag
- **State management**: Mutex-wrapped preferences and status in app state
- **Default values**: All preferences have sensible defaults

**Key data structures:**
- `UpdatePreferences`: auto_download, auto_install_on_app_quit, channel, check_on_startup, last_check_time
- `UpdateStatus`: event, data (JSON), update_downloaded flag
- `UpdateState`: Mutex-wrapped mutable state for preferences and status

## 4. Testing Best Practices

### Writing New Tests

1. **Use descriptive test names**: `test_validate_npm_invalid_package_names()` clearly states what's tested
2. **Add doc comments**: Explain test purpose before `#[test]` attribute
3. **Test both valid and invalid inputs**: Cover success paths and error cases
4. **Use temporary files**: Leverage `tempfile` crate for file-based tests, avoid persistent state
5. **Serialize global state tests**: Add `#[serial_test::serial]` to tests accessing OnceLock/Mutex to prevent race conditions

### Example: Adding a New Test

```rust
/// Test description of what is validated
#[test]
#[serial_test::serial]  // If test accesses static/Mutex state
fn test_new_feature() {
    // Arrange: Set up test data
    let config = SomeConfig { /* ... */ };

    // Act: Execute the function
    let result = some_function(config);

    // Assert: Verify expectations
    assert!(result.is_ok());
    assert_eq!(result.unwrap().property, expected_value);
}
```

### Common Assertions

- `assert!(condition)` - Boolean check
- `assert_eq!(actual, expected)` - Equality check
- `assert!(result.is_ok())` and `assert!(result.is_err())` - Result enum checks
- `assert!(!value.is_empty())` - Collection non-empty
- `assert_eq!(discriminant(&enum1), discriminant(&enum2))` - Enum variant equality

### Testing Serialization

Serde derive attributes enable automatic JSON serialization. Test serialization roundtrips:

```rust
let original = SomeStruct { /* ... */ };
let json = serde_json::to_string(&original).unwrap();
let deserialized: SomeStruct = serde_json::from_str(&json).unwrap();
assert_eq!(original.field, deserialized.field);
```

## 5. Relevant Code Modules

- `src-tauri/src/mcp_installer.rs` - Installation validation and progress tracking
- `src-tauri/src/mcp_registry.rs` - Registry search, filtering, and pagination
- `src-tauri/src/mcp_lifecycle.rs` - Process lifecycle state management
- `src-tauri/src/file_dialogs.rs` - File I/O operations
- `src-tauri/src/secure_storage.rs` - Keyring credential management
- `src-tauri/src/updates.rs` - Update preferences and status
- `src-tauri/Cargo.toml` - Test dependencies configuration
- `src-tauri/src/lib.rs` - Tauri command handler invocation

## 6. Attention

1. **Global state tests use `#[serial_test::serial]`**: Tests accessing OnceLock or Mutex globals must serialize to prevent race conditions
2. **Timestamp format**: All timestamps use RFC3339 ISO format via `chrono::Utc::now().to_rfc3339()`
3. **Dependency availability**: npm/git availability tests depend on system PATH; mock if needed for CI
4. **Keyring access**: Secure storage tests interact with OS keyring; may require special permissions in CI/headless environments
5. **Error propagation**: All Tauri commands return `Result<T, String>` for JSON serialization compatibility
