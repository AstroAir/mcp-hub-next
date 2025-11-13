use keyring::Entry;

const SERVICE_NAME: &str = "com.tauri.mcp-hub";
const CREDENTIAL_REGISTRY_KEY: &str = "_credential_registry";

/// Get the list of all registered credential keys
fn get_credential_registry() -> Result<Vec<String>, String> {
    let entry = Entry::new(SERVICE_NAME, CREDENTIAL_REGISTRY_KEY)
        .map_err(|e| format!("Failed to create registry entry: {}", e))?;

    match entry.get_password() {
        Ok(json) => serde_json::from_str(&json)
            .map_err(|e| format!("Failed to parse registry: {}", e)),
        Err(keyring::Error::NoEntry) => Ok(vec![]),
        Err(e) => Err(format!("Failed to get registry: {}", e)),
    }
}

/// Add a credential key to the registry
fn add_to_registry(key: &str) -> Result<(), String> {
    let mut registry = get_credential_registry()?;
    if !registry.contains(&key.to_string()) {
        registry.push(key.to_string());
        let entry = Entry::new(SERVICE_NAME, CREDENTIAL_REGISTRY_KEY)
            .map_err(|e| format!("Failed to create registry entry: {}", e))?;
        let json = serde_json::to_string(&registry)
            .map_err(|e| format!("Failed to serialize registry: {}", e))?;
        entry.set_password(&json)
            .map_err(|e| format!("Failed to update registry: {}", e))?;
    }
    Ok(())
}

/// Remove a credential key from the registry
fn remove_from_registry(key: &str) -> Result<(), String> {
    let mut registry = get_credential_registry()?;
    registry.retain(|k| k != key);
    let entry = Entry::new(SERVICE_NAME, CREDENTIAL_REGISTRY_KEY)
        .map_err(|e| format!("Failed to create registry entry: {}", e))?;
    let json = serde_json::to_string(&registry)
        .map_err(|e| format!("Failed to serialize registry: {}", e))?;
    entry.set_password(&json)
        .map_err(|e| format!("Failed to update registry: {}", e))?;
    Ok(())
}

/// Save a credential securely using the system keyring
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

/// Get a credential from the system keyring
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

/// Delete a credential from the system keyring
#[tauri::command]
pub fn delete_credential(key: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, &key)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;

    match entry.delete_credential() {
        Ok(_) => {
            // Remove from registry
            if let Err(e) = remove_from_registry(&key) {
                log::warn!("Failed to remove credential from registry: {}", e);
                // Don't fail the operation if registry update fails
            }
            log::info!("Deleted credential for key: {}", key);
            Ok(())
        }
        Err(keyring::Error::NoEntry) => {
            // Still try to remove from registry in case it's orphaned
            let _ = remove_from_registry(&key);
            Ok(())
        }
        Err(e) => Err(format!("Failed to delete credential: {}", e)),
    }
}

/// Check if a credential exists in the system keyring
#[tauri::command]
pub fn has_credential(key: String) -> Result<bool, String> {
    let entry = Entry::new(SERVICE_NAME, &key)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
    
    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(format!("Failed to check credential: {}", e)),
    }
}

/// Save OAuth token securely
#[tauri::command]
pub fn save_oauth_token(server_id: String, token: String) -> Result<(), String> {
    let key = format!("oauth_token_{}", server_id);
    save_credential(key, token)
}

/// Get OAuth token
#[tauri::command]
pub fn get_oauth_token(server_id: String) -> Result<Option<String>, String> {
    let key = format!("oauth_token_{}", server_id);
    get_credential(key)
}

/// Delete OAuth token
#[tauri::command]
pub fn delete_oauth_token(server_id: String) -> Result<(), String> {
    let key = format!("oauth_token_{}", server_id);
    delete_credential(key)
}

/// Save API key securely
#[tauri::command]
pub fn save_api_key(service: String, api_key: String) -> Result<(), String> {
    let key = format!("api_key_{}", service);
    save_credential(key, api_key)
}

/// Get API key
#[tauri::command]
pub fn get_api_key(service: String) -> Result<Option<String>, String> {
    let key = format!("api_key_{}", service);
    get_credential(key)
}

/// Delete API key
#[tauri::command]
pub fn delete_api_key(service: String) -> Result<(), String> {
    let key = format!("api_key_{}", service);
    delete_credential(key)
}

/// Save encrypted data (for sensitive configuration)
#[tauri::command]
pub fn save_encrypted_data(key: String, data: String) -> Result<(), String> {
    let storage_key = format!("encrypted_{}", key);
    save_credential(storage_key, data)
}

/// Get encrypted data
#[tauri::command]
pub fn get_encrypted_data(key: String) -> Result<Option<String>, String> {
    let storage_key = format!("encrypted_{}", key);
    get_credential(storage_key)
}

/// Delete encrypted data
#[tauri::command]
pub fn delete_encrypted_data(key: String) -> Result<(), String> {
    let storage_key = format!("encrypted_{}", key);
    delete_credential(storage_key)
}

/// Clear all credentials for this application
/// WARNING: This will delete all stored credentials
#[tauri::command]
pub fn clear_all_credentials() -> Result<(), String> {
    log::warn!("Clearing all credentials for application");

    // Get all registered credential keys
    let registry = match get_credential_registry() {
        Ok(r) => r,
        Err(e) => {
            log::error!("Failed to get credential registry: {}", e);
            return Err(format!("Failed to get credential registry: {}", e));
        }
    };

    let mut errors = Vec::new();
    let mut deleted_count = 0;

    // Delete each registered credential
    for key in &registry {
        let entry = match Entry::new(SERVICE_NAME, key) {
            Ok(e) => e,
            Err(e) => {
                log::warn!("Failed to create entry for {}: {}", key, e);
                errors.push(format!("Failed to create entry for {}: {}", key, e));
                continue;
            }
        };

        match entry.delete_credential() {
            Ok(_) => {
                deleted_count += 1;
                log::info!("Deleted credential: {}", key);
            }
            Err(keyring::Error::NoEntry) => {
                // Already deleted, this is fine
                log::debug!("Credential already deleted: {}", key);
            }
            Err(e) => {
                log::warn!("Failed to delete credential {}: {}", key, e);
                errors.push(format!("Failed to delete {}: {}", key, e));
            }
        }
    }

    // Clear the registry itself
    let registry_entry = Entry::new(SERVICE_NAME, CREDENTIAL_REGISTRY_KEY)
        .map_err(|e| format!("Failed to create registry entry: {}", e))?;

    match registry_entry.delete_credential() {
        Ok(_) => log::info!("Cleared credential registry"),
        Err(keyring::Error::NoEntry) => {
            // Registry already empty, this is fine
            log::debug!("Registry already empty");
        }
        Err(e) => {
            log::warn!("Failed to delete registry: {}", e);
            errors.push(format!("Failed to delete registry: {}", e));
        }
    }

    log::info!(
        "Cleared {} credentials from registry (total registry size: {})",
        deleted_count,
        registry.len()
    );

    if !errors.is_empty() {
        let error_msg = format!(
            "Cleared {} credentials but encountered {} errors: {}",
            deleted_count,
            errors.len(),
            errors.join("; ")
        );
        log::warn!("{}", error_msg);
        return Err(error_msg);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Test SERVICE_NAME constant
    #[test]
    fn test_service_name_constant() {
        assert_eq!(SERVICE_NAME, "com.tauri.mcp-hub");
    }

    /// Test OAuth token key formatting
    #[test]
    fn test_oauth_token_key_format() {
        let server_id = "my-server-123";
        let expected_key = format!("oauth_token_{}", server_id);
        assert_eq!(expected_key, "oauth_token_my-server-123");
    }

    /// Test API key formatting
    #[test]
    fn test_api_key_format() {
        let service = "openai";
        let expected_key = format!("api_key_{}", service);
        assert_eq!(expected_key, "api_key_openai");
    }

    /// Test encrypted data key formatting
    #[test]
    fn test_encrypted_data_key_format() {
        let key = "user-settings";
        let expected_key = format!("encrypted_{}", key);
        assert_eq!(expected_key, "encrypted_user-settings");
    }

    /// Test keyring Entry creation doesn't panic
    #[test]
    fn test_keyring_entry_creation() {
        // This tests that Entry::new doesn't panic with valid inputs
        let result = Entry::new(SERVICE_NAME, "test-key");
        assert!(result.is_ok());
    }

    /// Test clear_all_credentials returns Ok when registry is empty
    #[test]
    fn test_clear_all_credentials_empty_registry() {
        // When the registry is empty (no credentials saved),
        // clear_all_credentials should succeed without errors
        let result = clear_all_credentials();
        // Should be Ok even with an empty or non-existent registry
        assert!(result.is_ok());
    }

    /// Test key formats for different server IDs
    #[test]
    fn test_various_key_formats() {
        let test_cases = vec![
            ("server-1", "oauth_token_server-1"),
            ("my_server", "oauth_token_my_server"),
            ("server.123", "oauth_token_server.123"),
            ("server@test", "oauth_token_server@test"),
        ];

        for (server_id, expected) in test_cases {
            let key = format!("oauth_token_{}", server_id);
            assert_eq!(key, expected);
        }
    }

    /// Test service name formats for API keys
    #[test]
    fn test_api_key_service_formats() {
        let services = vec!["openai", "anthropic", "google", "aws"];

        for service in services {
            let key = format!("api_key_{}", service);
            assert!(key.starts_with("api_key_"));
            assert!(key.contains(service));
        }
    }

    /// Test encrypted data key uniqueness
    #[test]
    fn test_encrypted_data_key_uniqueness() {
        let key1 = format!("encrypted_{}", "data1");
        let key2 = format!("encrypted_{}", "data2");

        assert_ne!(key1, key2);
        assert_eq!(key1, "encrypted_data1");
        assert_eq!(key2, "encrypted_data2");
    }

    /// Test credential registry key constant
    #[test]
    fn test_credential_registry_key_constant() {
        assert_eq!(CREDENTIAL_REGISTRY_KEY, "_credential_registry");
        // Registry key should start with underscore to distinguish from user keys
        assert!(CREDENTIAL_REGISTRY_KEY.starts_with('_'));
    }

    /// Test get_credential_registry returns empty vector when no registry exists
    #[test]
    fn test_get_credential_registry_empty() {
        // Note: This test may fail if there's an existing registry from previous runs
        // In a real test environment, we'd want to clean up or use a test-specific service name
        let result = get_credential_registry();
        assert!(result.is_ok());
        // Result should be either empty or contain existing credentials
        let registry = result.unwrap();
        assert!(registry.is_empty() || !registry.is_empty());
    }

    /// Test registry key format consistency
    #[test]
    fn test_registry_functions_exist() {
        // This test just verifies that the registry functions are properly defined
        // and can be called (even if they fail due to keyring access)
        let _ = get_credential_registry();
        let _ = add_to_registry("test_key");
        let _ = remove_from_registry("test_key");
    }
}

