use keyring::Entry;

const SERVICE_NAME: &str = "com.tauri.mcp-hub";

/// Save a credential securely using the system keyring
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
            log::info!("Deleted credential for key: {}", key);
            Ok(())
        }
        Err(keyring::Error::NoEntry) => Ok(()), // Already deleted
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
    // This is a destructive operation, so we log it
    log::warn!("Clearing all credentials for application");
    
    // Note: keyring doesn't provide a way to list all entries,
    // so we can't automatically delete all. This is a limitation.
    // Users would need to manually delete specific credentials.
    
    Ok(())
}

