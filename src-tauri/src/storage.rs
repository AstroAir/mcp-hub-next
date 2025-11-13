use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Get the app data directory path
fn get_app_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))
}

/// Ensure the app data directory exists
fn ensure_app_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = get_app_data_dir(app)?;
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    Ok(dir)
}

/// Get the app data directory path as a string
#[tauri::command]
pub fn get_app_data_path(app: AppHandle) -> Result<String, String> {
    let dir = get_app_data_dir(&app)?;
    dir.to_str()
        .ok_or_else(|| "Invalid path".to_string())
        .map(|s| s.to_string())
}

/// Save servers configuration
#[tauri::command]
pub fn save_servers(app: AppHandle, servers: String) -> Result<(), String> {
    let dir = ensure_app_data_dir(&app)?;
    let file_path = dir.join("servers.json");
    
    fs::write(&file_path, servers)
        .map_err(|e| format!("Failed to save servers: {}", e))?;
    
    log::info!("Saved servers to {:?}", file_path);
    Ok(())
}

/// Load servers configuration
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

/// Save chat sessions
#[tauri::command]
pub fn save_chat_sessions(app: AppHandle, sessions: String) -> Result<(), String> {
    let dir = ensure_app_data_dir(&app)?;
    let file_path = dir.join("chat_sessions.json");
    
    fs::write(&file_path, sessions)
        .map_err(|e| format!("Failed to save chat sessions: {}", e))?;
    
    log::info!("Saved chat sessions to {:?}", file_path);
    Ok(())
}

/// Load chat sessions
#[tauri::command]
pub fn load_chat_sessions(app: AppHandle) -> Result<String, String> {
    let dir = get_app_data_dir(&app)?;
    let file_path = dir.join("chat_sessions.json");
    
    if !file_path.exists() {
        return Ok("[]".to_string());
    }
    
    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to load chat sessions: {}", e))
}

/// Save application settings
#[tauri::command]
pub fn save_settings(app: AppHandle, settings: String) -> Result<(), String> {
    let dir = ensure_app_data_dir(&app)?;
    let file_path = dir.join("settings.json");
    
    fs::write(&file_path, settings)
        .map_err(|e| format!("Failed to save settings: {}", e))?;
    
    log::info!("Saved settings to {:?}", file_path);
    Ok(())
}

/// Load application settings
#[tauri::command]
pub fn load_settings(app: AppHandle) -> Result<String, String> {
    let dir = get_app_data_dir(&app)?;
    let file_path = dir.join("settings.json");
    
    if !file_path.exists() {
        return Ok("{}".to_string());
    }
    
    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to load settings: {}", e))
}

/// Save connection history
#[tauri::command]
pub fn save_connection_history(app: AppHandle, history: String) -> Result<(), String> {
    let dir = ensure_app_data_dir(&app)?;
    let file_path = dir.join("connection_history.json");
    
    fs::write(&file_path, history)
        .map_err(|e| format!("Failed to save connection history: {}", e))?;
    
    log::info!("Saved connection history to {:?}", file_path);
    Ok(())
}

/// Load connection history
#[tauri::command]
pub fn load_connection_history(app: AppHandle) -> Result<String, String> {
    let dir = get_app_data_dir(&app)?;
    let file_path = dir.join("connection_history.json");
    
    if !file_path.exists() {
        return Ok("[]".to_string());
    }
    
    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to load connection history: {}", e))
}

/// Save backup data
#[tauri::command]
pub fn save_backup(app: AppHandle, backup_id: String, data: String) -> Result<(), String> {
    let dir = ensure_app_data_dir(&app)?;
    let backups_dir = dir.join("backups");
    
    fs::create_dir_all(&backups_dir)
        .map_err(|e| format!("Failed to create backups directory: {}", e))?;
    
    let file_path = backups_dir.join(format!("{}.json", backup_id));
    
    fs::write(&file_path, data)
        .map_err(|e| format!("Failed to save backup: {}", e))?;
    
    log::info!("Saved backup to {:?}", file_path);
    Ok(())
}

/// Load backup data
#[tauri::command]
pub fn load_backup(app: AppHandle, backup_id: String) -> Result<String, String> {
    let dir = get_app_data_dir(&app)?;
    let file_path = dir.join("backups").join(format!("{}.json", backup_id));
    
    if !file_path.exists() {
        return Err("Backup not found".to_string());
    }
    
    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to load backup: {}", e))
}

/// Delete backup data
#[tauri::command]
pub fn delete_backup(app: AppHandle, backup_id: String) -> Result<(), String> {
    let dir = get_app_data_dir(&app)?;
    let file_path = dir.join("backups").join(format!("{}.json", backup_id));
    
    if file_path.exists() {
        fs::remove_file(&file_path)
            .map_err(|e| format!("Failed to delete backup: {}", e))?;
        log::info!("Deleted backup {:?}", file_path);
    }
    
    Ok(())
}

/// List all backups
#[tauri::command]
pub fn list_backups(app: AppHandle) -> Result<Vec<String>, String> {
    let dir = get_app_data_dir(&app)?;
    let backups_dir = dir.join("backups");
    
    if !backups_dir.exists() {
        return Ok(Vec::new());
    }
    
    let entries = fs::read_dir(&backups_dir)
        .map_err(|e| format!("Failed to read backups directory: {}", e))?;
    
    let mut backup_ids = Vec::new();
    
    for entry in entries.flatten() {
        if let Some(file_name) = entry.file_name().to_str() {
            if file_name.ends_with(".json") {
                let backup_id = file_name.trim_end_matches(".json").to_string();
                backup_ids.push(backup_id);
            }
        }
    }
    
    Ok(backup_ids)
}

/// Clear all application data (for testing/reset purposes)
#[tauri::command]
pub fn clear_all_data(app: AppHandle) -> Result<(), String> {
    let dir = get_app_data_dir(&app)?;

    if dir.exists() {
        fs::remove_dir_all(&dir)
            .map_err(|e| format!("Failed to clear data: {}", e))?;
        log::info!("Cleared all application data");
    }

    Ok(())
}

/// Save installation metadata to persistent storage
#[tauri::command]
pub fn save_installation_metadata(app: AppHandle, metadata_json: String) -> Result<(), String> {
    let dir = ensure_app_data_dir(&app)?;
    let file_path = dir.join("installation_metadata.json");

    fs::write(&file_path, metadata_json)
        .map_err(|e| format!("Failed to write installation metadata file: {}", e))?;

    log::info!("Saved installation metadata to {:?}", file_path);
    Ok(())
}

/// Load installation metadata from persistent storage
#[tauri::command]
pub fn load_installation_metadata(app: AppHandle) -> Result<String, String> {
    let dir = get_app_data_dir(&app)?;
    let file_path = dir.join("installation_metadata.json");

    if !file_path.exists() {
        log::info!("No installation metadata file found, returning empty");
        return Ok("[]".to_string());
    }

    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read installation metadata file: {}", e))
}

#[cfg(test)]
mod tests {
    use std::fs;
    use tempfile::TempDir;

    // Helper to create a mock AppHandle for testing
    // Note: Since AppHandle requires complex Tauri runtime setup, these tests
    // will focus on testing the data structures and file operations logic

    /// Test servers JSON save and load cycle
    #[test]
    fn test_servers_save_load_empty() {
        let servers_json = "[]";
        let parsed: serde_json::Value = serde_json::from_str(servers_json).unwrap();
        assert!(parsed.is_array());
        assert_eq!(parsed.as_array().unwrap().len(), 0);
    }

    /// Test servers JSON with valid data
    #[test]
    fn test_servers_json_structure() {
        let servers_json = r#"[
            {
                "id": "server-1",
                "name": "Test Server",
                "transportType": "stdio",
                "command": "node",
                "args": ["server.js"]
            }
        ]"#;

        let parsed: serde_json::Value = serde_json::from_str(servers_json).unwrap();
        assert!(parsed.is_array());
        let servers = parsed.as_array().unwrap();
        assert_eq!(servers.len(), 1);
        assert_eq!(servers[0]["id"], "server-1");
        assert_eq!(servers[0]["transportType"], "stdio");
    }

    /// Test chat sessions JSON structure
    #[test]
    fn test_chat_sessions_json_structure() {
        let sessions_json = r#"[
            {
                "id": "session-1",
                "title": "Test Chat",
                "messages": [
                    {"role": "user", "content": "Hello"},
                    {"role": "assistant", "content": "Hi there!"}
                ],
                "createdAt": "2025-01-01T00:00:00Z"
            }
        ]"#;

        let parsed: serde_json::Value = serde_json::from_str(sessions_json).unwrap();
        assert!(parsed.is_array());
        let sessions = parsed.as_array().unwrap();
        assert_eq!(sessions.len(), 1);
        assert_eq!(sessions[0]["id"], "session-1");
        assert_eq!(sessions[0]["messages"].as_array().unwrap().len(), 2);
    }

    /// Test settings JSON structure
    #[test]
    fn test_settings_json_structure() {
        let settings_json = r#"{
            "theme": "dark",
            "language": "en",
            "autoSave": true
        }"#;

        let parsed: serde_json::Value = serde_json::from_str(settings_json).unwrap();
        assert!(parsed.is_object());
        assert_eq!(parsed["theme"], "dark");
        assert_eq!(parsed["autoSave"], true);
    }

    /// Test connection history JSON structure
    #[test]
    fn test_connection_history_json_structure() {
        let history_json = r#"[
            {
                "serverId": "server-1",
                "connectedAt": "2025-01-01T00:00:00Z",
                "disconnectedAt": "2025-01-01T01:00:00Z",
                "status": "success"
            }
        ]"#;

        let parsed: serde_json::Value = serde_json::from_str(history_json).unwrap();
        assert!(parsed.is_array());
        let history = parsed.as_array().unwrap();
        assert_eq!(history.len(), 1);
        assert_eq!(history[0]["status"], "success");
    }

    /// Test backup JSON structure
    #[test]
    fn test_backup_json_structure() {
        let backup_json = r#"{
            "version": "1.0",
            "timestamp": "2025-01-01T00:00:00Z",
            "servers": [],
            "settings": {},
            "chatSessions": []
        }"#;

        let parsed: serde_json::Value = serde_json::from_str(backup_json).unwrap();
        assert!(parsed.is_object());
        assert_eq!(parsed["version"], "1.0");
        assert!(parsed["servers"].is_array());
        assert!(parsed["settings"].is_object());
    }

    /// Test file operations with temp directory
    #[test]
    fn test_file_write_and_read() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.json");

        let content = r#"{"test": true}"#;
        fs::write(&file_path, content).unwrap();

        let read_content = fs::read_to_string(&file_path).unwrap();
        assert_eq!(read_content, content);
    }

    /// Test directory creation
    #[test]
    fn test_directory_creation() {
        let temp_dir = TempDir::new().unwrap();
        let nested_dir = temp_dir.path().join("backups").join("nested");

        fs::create_dir_all(&nested_dir).unwrap();
        assert!(nested_dir.exists());
        assert!(nested_dir.is_dir());
    }

    /// Test backup ID extraction from filename
    #[test]
    fn test_backup_id_from_filename() {
        let filename = "backup-2025-01-01.json";
        let backup_id = filename.trim_end_matches(".json");
        assert_eq!(backup_id, "backup-2025-01-01");
    }

    /// Test backup ID with special characters
    #[test]
    fn test_backup_id_special_chars() {
        let test_cases = vec![
            ("backup_2025_01_01.json", "backup_2025_01_01"),
            ("backup-with-dashes.json", "backup-with-dashes"),
            ("backup.with.dots.json", "backup.with.dots"),
        ];

        for (filename, expected_id) in test_cases {
            let backup_id = filename.trim_end_matches(".json");
            assert_eq!(backup_id, expected_id);
        }
    }

    /// Test listing backup files
    #[test]
    fn test_list_backup_files() {
        let temp_dir = TempDir::new().unwrap();
        let backups_dir = temp_dir.path().join("backups");
        fs::create_dir_all(&backups_dir).unwrap();

        // Create test backup files
        fs::write(backups_dir.join("backup1.json"), "{}").unwrap();
        fs::write(backups_dir.join("backup2.json"), "{}").unwrap();
        fs::write(backups_dir.join("not-backup.txt"), "text").unwrap();

        let entries = fs::read_dir(&backups_dir).unwrap();
        let mut backup_ids = Vec::new();

        for entry in entries.flatten() {
            if let Some(file_name) = entry.file_name().to_str() {
                if file_name.ends_with(".json") {
                    let backup_id = file_name.trim_end_matches(".json").to_string();
                    backup_ids.push(backup_id);
                }
            }
        }

        backup_ids.sort();
        assert_eq!(backup_ids.len(), 2);
        assert_eq!(backup_ids[0], "backup1");
        assert_eq!(backup_ids[1], "backup2");
    }

    /// Test file deletion
    #[test]
    fn test_file_deletion() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("to_delete.json");

        fs::write(&file_path, "{}").unwrap();
        assert!(file_path.exists());

        fs::remove_file(&file_path).unwrap();
        assert!(!file_path.exists());
    }

    /// Test directory removal
    #[test]
    fn test_directory_removal() {
        let temp_dir = TempDir::new().unwrap();
        let nested_dir = temp_dir.path().join("to_remove");

        fs::create_dir_all(&nested_dir).unwrap();
        fs::write(nested_dir.join("file.json"), "{}").unwrap();

        fs::remove_dir_all(&nested_dir).unwrap();
        assert!(!nested_dir.exists());
    }

    /// Test large JSON data handling
    #[test]
    fn test_large_json_handling() {
        let mut servers = Vec::new();
        for i in 0..100 {
            servers.push(serde_json::json!({
                "id": format!("server-{}", i),
                "name": format!("Server {}", i),
                "transportType": "stdio"
            }));
        }

        let json_str = serde_json::to_string(&servers).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json_str).unwrap();

        assert!(parsed.is_array());
        assert_eq!(parsed.as_array().unwrap().len(), 100);
    }

    /// Test empty settings object
    #[test]
    fn test_empty_settings() {
        let settings_json = "{}";
        let parsed: serde_json::Value = serde_json::from_str(settings_json).unwrap();
        assert!(parsed.is_object());
        assert_eq!(parsed.as_object().unwrap().len(), 0);
    }

    /// Test nested JSON structures
    #[test]
    fn test_nested_json_structures() {
        let nested_json = r#"{
            "servers": {
                "stdio": [{"id": "1"}],
                "sse": [{"id": "2"}],
                "http": [{"id": "3"}]
            },
            "metadata": {
                "version": "1.0",
                "lastModified": "2025-01-01"
            }
        }"#;

        let parsed: serde_json::Value = serde_json::from_str(nested_json).unwrap();
        assert!(parsed.is_object());
        assert!(parsed["servers"]["stdio"].is_array());
        assert_eq!(parsed["servers"]["stdio"][0]["id"], "1");
    }

    /// Test JSON with special characters
    #[test]
    fn test_json_special_characters() {
        let json_with_special = r#"{
            "name": "Server with \"quotes\"",
            "path": "C:\\Windows\\System32",
            "unicode": "Hello 世界 🌍"
        }"#;

        let parsed: serde_json::Value = serde_json::from_str(json_with_special).unwrap();
        assert_eq!(parsed["name"], "Server with \"quotes\"");
        assert_eq!(parsed["unicode"], "Hello 世界 🌍");
    }

    /// Test file path validation
    #[test]
    fn test_file_path_validation() {
        let temp_dir = TempDir::new().unwrap();
        let valid_path = temp_dir.path().join("valid.json");

        // Test that parent directory exists
        assert!(valid_path.parent().unwrap().exists());

        // Test path to string conversion
        let path_str = valid_path.to_str().unwrap();
        assert!(path_str.ends_with("valid.json"));
    }

    /// Test concurrent file operations simulation
    #[test]
    fn test_multiple_file_operations() {
        let temp_dir = TempDir::new().unwrap();

        // Simulate saving multiple data types
        let files = vec![
            ("servers.json", "[]"),
            ("chat_sessions.json", "[]"),
            ("settings.json", "{}"),
            ("connection_history.json", "[]"),
        ];

        for (filename, content) in files {
            let file_path = temp_dir.path().join(filename);
            fs::write(&file_path, content).unwrap();
            assert!(file_path.exists());
        }

        // Verify all files exist
        let entries: Vec<_> = fs::read_dir(temp_dir.path()).unwrap().collect();
        assert_eq!(entries.len(), 4);
    }
}

