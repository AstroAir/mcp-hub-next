# Adding Rust Tests to Tauri Backend

## 1. Purpose

This SOP provides step-by-step guidance for developers adding new tests to the Tauri Rust backend. Tests validate input validation, state transitions, serialization, and error handling across command handlers and utility functions. Following these patterns ensures consistent test coverage and maintains the 69-test baseline.

## 2. Step-by-Step Guide

### Step 1: Identify the Module

1. Determine which Rust file requires testing: `src-tauri/src/{module}.rs`
2. Check existing tests at the bottom of the file in `#[cfg(test)] mod tests { ... }`
3. Review the structure: Test module contains all tests for that file

### Step 2: Design Test Cases

Before writing code, determine what to test:

**For validation functions (mcp_installer, mcp_registry, mcp_lifecycle):**
- Valid inputs that should pass
- Invalid inputs that should fail (edge cases, boundary conditions)
- Error messages are clear and specific
- Estimates/calculations are correct

**For state management functions:**
- State transitions are valid
- Serialization/deserialization roundtrips
- Default values are sensible
- Concurrent access is safe (if using static state)

**For file I/O functions (file_dialogs):**
- Create temp files/directories
- Read operations preserve content
- UTF-8 encoding is validated
- Cleanup happens automatically

**For keyring functions (secure_storage):**
- Keys are formatted correctly with service name prefix
- Save/retrieve/delete operations succeed
- Missing entries return None (not error)
- OAuth token keys use proper prefix

### Step 3: Add Test Function

1. **Open the module file**: `src-tauri/src/{module}.rs`
2. **Scroll to end**: Find `#[cfg(test)] mod tests { ... }` block
3. **Add test function** before closing brace:

```rust
/// Test description explaining what is validated
#[test]
fn test_function_name() {
    // Test body here
}
```

4. **If test accesses global state** (OnceLock/Mutex):
   - Add `#[serial_test::serial]` attribute above `#[test]`
   - Example: `registry_search()` tests need this because they access static cache

### Step 4: Write Test Body

Follow the Arrange-Act-Assert pattern:

```rust
#[test]
fn test_validate_npm_package_names() {
    // ARRANGE: Create test data
    let config = InstallConfig::Npm {
        package_name: "express".to_string(),
        version: None,
        global: None,
        registry: None,
    };

    // ACT: Call function under test
    let result = validate_install(config);

    // ASSERT: Verify expectations
    assert!(result.is_ok());
    let validation = result.unwrap();
    assert!(!validation.errors.iter().any(|e| e.contains("Invalid npm package name")));
}
```

### Step 5: Use Temporary Files (file_dialogs tests)

For file I/O testing:

```rust
#[test]
fn test_file_read_write() {
    // Create temp directory (auto-cleaned)
    let temp_dir = tempfile::tempdir().expect("failed to create temp dir");
    let file_path = temp_dir.path().join("test.txt");

    // Write to file
    std::fs::write(&file_path, "test content").unwrap();

    // Read and verify
    let content = std::fs::read_to_string(&file_path).unwrap();
    assert_eq!(content, "test content");

    // Cleanup happens automatically when temp_dir is dropped
}
```

### Step 6: Test Serialization

For any struct with `#[derive(Serialize, Deserialize)]`:

```rust
#[test]
fn test_install_config_serde_npm() {
    // Create struct instance
    let config = InstallConfig::Npm {
        package_name: "@scope/package".to_string(),
        version: Some("1.0.0".to_string()),
        global: Some(true),
        registry: Some("https://registry.npmjs.org".to_string()),
    };

    // Serialize to JSON
    let json = serde_json::to_string(&config).unwrap();

    // Deserialize back
    let deserialized: InstallConfig = serde_json::from_str(&json).unwrap();

    // Verify all fields match
    if let InstallConfig::Npm { package_name, version, global, registry } = deserialized {
        assert_eq!(package_name, "@scope/package");
        assert_eq!(version, Some("1.0.0".to_string()));
        assert_eq!(global, Some(true));
        assert_eq!(registry, Some("https://registry.npmjs.org".to_string()));
    } else {
        panic!("Expected Npm variant");
    }
}
```

### Step 7: Handle Global State Tests

If test accesses `OnceLock<Mutex<...>>` static state:

```rust
#[test]
#[serial_test::serial]  // Serialize this test
fn test_registry_search_with_query() {
    // This test accesses CACHE static
    let filters = RegistrySearchFilters {
        query: Some("filesystem".to_string()),
        source: None,
        tags: None,
        verified: None,
        sort_by: None,
        limit: None,
        offset: None,
    };

    let result = registry_search(filters);
    assert!(result.is_ok());

    let (servers, _, _) = result.unwrap();
    assert!(!servers.is_empty());
}
```

### Step 8: Test Error Cases

Always test failure paths:

```rust
#[test]
fn test_validate_github_repository_invalid() {
    // Invalid: missing owner
    let config = InstallConfig::GitHub {
        repository: "servers".to_string(),  // Should be owner/repo
        branch: None,
        tag: None,
        commit: None,
        sub_path: None,
    };

    let result = validate_install(config);
    assert!(result.is_ok());

    let validation = result.unwrap();
    assert!(!validation.valid);
    assert!(validation.errors.iter().any(|e| e.contains("Invalid GitHub repository format")));
}
```

### Step 9: Run Tests

```bash
# Run all tests to verify new test works
cargo test --lib

# Run only your new test
cargo test --lib test_function_name

# Run with output for debugging
cargo test --lib test_function_name -- --nocapture

# Check for clippy warnings
cargo clippy --all-targets
```

### Step 10: Verify Coverage

1. Ensure test passes consistently
2. Verify no clippy warnings introduced
3. Check test output shows expected assertions
4. Confirm serialization roundtrips work
5. Ensure error cases are tested

## 3. Testing Patterns by Module

### mcp_installer.rs Pattern

Focus on:
- Package name validation (regex patterns)
- GitHub repo format validation
- Local path existence checks
- Serialization of InstallConfig enum variants
- Timestamp generation (RFC3339 format)

### mcp_registry.rs Pattern

Focus on:
- Known servers count and properties
- Search filtering (query, source, verified)
- Pagination (limit, offset, has_more)
- Sorting (by downloads, stars, updated)
- Categories extraction and sorting
- Serialization of RegistryServerEntry

Use `#[serial_test::serial]` because tests access static CACHE.

### mcp_lifecycle.rs Pattern

Focus on:
- LifecycleState transitions
- MCPServerProcess structure
- StdioConfig validation
- Timestamp generation
- Uptime calculation

### file_dialogs.rs Pattern

Focus on:
- File creation with tempfile
- File reading/writing
- Metadata extraction
- UTF-8 validation
- Error cases (missing files)

Use `tempfile::tempdir()` for isolated, auto-cleaned directories.

### secure_storage.rs Pattern

Focus on:
- Key formatting with SERVICE_NAME prefix
- Keyring entry creation
- OAuth token key prefixing
- Credential lifecycle (save/get/delete/has)

Test with actual system keyring (CI may need special setup).

### updates.rs Pattern

Focus on:
- UpdatePreferences defaults
- Serialization with camelCase conversion
- UpdateStatus structure
- Mutex-wrapped state access

## 4. Relevant Code Modules

- `src-tauri/src/mcp_installer.rs` - Add tests for validation functions
- `src-tauri/src/mcp_registry.rs` - Add tests for search/filtering/pagination
- `src-tauri/src/mcp_lifecycle.rs` - Add tests for state transitions
- `src-tauri/src/file_dialogs.rs` - Add tests for file I/O
- `src-tauri/src/secure_storage.rs` - Add tests for keyring operations
- `src-tauri/src/updates.rs` - Add tests for preferences/status
- `src-tauri/Cargo.toml` - Verify test dependencies are present

## 5. Attention

1. **Always use `#[serial_test::serial]`**: When test accesses OnceLock/Mutex static state to prevent race conditions
2. **RFC3339 timestamps**: Use `chrono::Utc::now().to_rfc3339()` for all timestamp generation
3. **Service name prefix**: All keyring tests use `"com.tauri.mcp-hub"` service name
4. **Temp file cleanup**: tempfile crate auto-cleans when dropped; don't manual cleanup
5. **Error message checks**: Verify error strings in validation results are present and specific
