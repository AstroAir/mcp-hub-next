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
    
    for entry in entries {
        if let Ok(entry) = entry {
            if let Some(file_name) = entry.file_name().to_str() {
                if file_name.ends_with(".json") {
                    let backup_id = file_name.trim_end_matches(".json").to_string();
                    backup_ids.push(backup_id);
                }
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

