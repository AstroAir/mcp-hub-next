use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};
use std::path::PathBuf;

/// Update preferences stored in app state
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePreferences {
    pub auto_download: bool,
    pub auto_install_on_app_quit: bool,
    pub channel: String,
    pub check_on_startup: bool,
    pub last_check_time: Option<u64>,
}

impl Default for UpdatePreferences {
    fn default() -> Self {
        Self {
            auto_download: true,
            auto_install_on_app_quit: true,
            channel: "stable".to_string(),
            check_on_startup: true,
            last_check_time: None,
        }
    }
}

/// Update status information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateStatus {
    pub event: String,
    pub data: Option<serde_json::Value>,
    pub update_downloaded: Option<bool>,
}

/// Update information cached from check
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedUpdate {
    pub version: String,
    pub current_version: String,
    pub date: Option<String>,
    pub body: Option<String>,
}

/// App state for managing update preferences
pub struct UpdateState {
    pub preferences: Mutex<UpdatePreferences>,
    pub status: Mutex<Option<UpdateStatus>>,
    pub cached_update: Mutex<Option<CachedUpdate>>,
}

impl Default for UpdateState {
    fn default() -> Self {
        Self {
            preferences: Mutex::new(UpdatePreferences::default()),
            status: Mutex::new(None),
            cached_update: Mutex::new(None),
        }
    }
}

/// Get the preferences file path
fn get_preferences_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    std::fs::create_dir_all(&app_data)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;

    Ok(app_data.join("update_preferences.json"))
}

/// Load preferences from disk
pub fn load_preferences_from_disk(app: &AppHandle) -> Result<UpdatePreferences, String> {
    let path = get_preferences_path(app)?;

    if !path.exists() {
        return Ok(UpdatePreferences::default());
    }

    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read preferences file: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse preferences: {}", e))
}

/// Save preferences to disk
fn save_preferences_to_disk(app: &AppHandle, preferences: &UpdatePreferences) -> Result<(), String> {
    let path = get_preferences_path(app)?;

    let content = serde_json::to_string_pretty(preferences)
        .map_err(|e| format!("Failed to serialize preferences: {}", e))?;

    std::fs::write(&path, content)
        .map_err(|e| format!("Failed to write preferences file: {}", e))
}

/// Get the current app version
#[tauri::command]
pub fn get_app_version(app: AppHandle) -> Result<String, String> {
    app.package_info()
        .version
        .to_string()
        .parse()
        .map_err(|e| format!("Failed to get app version: {}", e))
}

/// Get update preferences
#[tauri::command]
pub fn get_update_preferences(
    app: AppHandle,
    state: State<'_, UpdateState>,
) -> Result<UpdatePreferences, String> {
    // Try to load from disk first
    let disk_prefs = load_preferences_from_disk(&app).ok();

    if let Some(prefs) = disk_prefs {
        // Update state with disk preferences
        if let Ok(mut state_prefs) = state.preferences.lock() {
            *state_prefs = prefs.clone();
        }
        Ok(prefs)
    } else {
        // Fall back to state
        state
            .preferences
            .lock()
            .map(|prefs| prefs.clone())
            .map_err(|e| format!("Failed to get preferences: {}", e))
    }
}

/// Set update preferences
#[tauri::command]
pub fn set_update_preferences(
    app: AppHandle,
    state: State<'_, UpdateState>,
    preferences: UpdatePreferences,
) -> Result<(), String> {
    // Save to disk first
    save_preferences_to_disk(&app, &preferences)?;

    // Then update state
    state
        .preferences
        .lock()
        .map(|mut prefs| {
            *prefs = preferences;
        })
        .map_err(|e| format!("Failed to set preferences: {}", e))
}

/// Get current update status
#[tauri::command]
pub fn get_update_status(state: State<'_, UpdateState>) -> Result<Option<UpdateStatus>, String> {
    state
        .status
        .lock()
        .map(|status| status.clone())
        .map_err(|e| format!("Failed to get update status: {}", e))
}

/// Check for updates
#[tauri::command]
pub async fn check_for_updates(
    app: AppHandle,
    state: State<'_, UpdateState>,
) -> Result<(), String> {
    use tauri_plugin_updater::UpdaterExt;

    // Emit checking status
    let checking_status = UpdateStatus {
        event: "checking-for-update".to_string(),
        data: None,
        update_downloaded: None,
    };

    // Update state
    if let Ok(mut status) = state.status.lock() {
        *status = Some(checking_status.clone());
    }

    // Emit event to frontend
    app.emit("update-status", checking_status)
        .map_err(|e| format!("Failed to emit event: {}", e))?;

    // Update last check time
    if let Ok(mut prefs) = state.preferences.lock() {
        prefs.last_check_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .ok()
            .map(|d| d.as_secs());
    }

    // Check for updates using tauri-plugin-updater
    match app.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(Some(update)) => {
                    log::info!("Update available: {}", update.version);

                    let mut data = serde_json::Map::new();
                    data.insert("version".to_string(), serde_json::Value::String(update.version.clone()));
                    data.insert("currentVersion".to_string(), serde_json::Value::String(update.current_version.clone()));
                    if let Some(date) = update.date {
                        data.insert("date".to_string(), serde_json::Value::String(date.to_string()));
                    }
                    data.insert("body".to_string(), serde_json::Value::String(update.body.clone().unwrap_or_default()));

                    let update_available_status = UpdateStatus {
                        event: "update-available".to_string(),
                        data: Some(serde_json::Value::Object(data)),
                        update_downloaded: Some(false),
                    };

                    if let Ok(mut status) = state.status.lock() {
                        *status = Some(update_available_status.clone());
                    }

                    app.emit("update-status", update_available_status)
                        .map_err(|e| format!("Failed to emit event: {}", e))?;

                    // Auto-download if enabled
                    let auto_download = if let Ok(prefs) = state.preferences.lock() {
                        prefs.auto_download
                    } else {
                        false
                    };

                    // Cache the update info for manual download
                    let cached = CachedUpdate {
                        version: update.version.clone(),
                        current_version: update.current_version.clone(),
                        date: update.date.map(|d| d.to_string()),
                        body: update.body.clone(),
                    };

                    if let Ok(mut cache) = state.cached_update.lock() {
                        *cache = Some(cached);
                    }

                    if auto_download {
                        log::info!("Auto-downloading update...");

                        // Clone app handle for closures
                        let app_clone = app.clone();
                        let app_clone2 = app.clone();

                        // Download the update with progress tracking
                        let mut downloaded_bytes: usize = 0;
                        match update.download_and_install(
                            move |chunk_length, content_length| {
                                downloaded_bytes += chunk_length;
                                if let Some(total) = content_length {
                                    let percent = ((downloaded_bytes as f64 / total as f64) * 100.0) as u32;
                                    log::debug!("Download progress: {}%", percent);

                                    // Emit progress event
                                    let mut progress_data = serde_json::Map::new();
                                    progress_data.insert("percent".to_string(), serde_json::Value::Number(percent.into()));
                                    progress_data.insert("downloaded".to_string(), serde_json::Value::Number(downloaded_bytes.into()));
                                    progress_data.insert("total".to_string(), serde_json::Value::Number(total.into()));

                                    let progress_status = UpdateStatus {
                                        event: "download-progress".to_string(),
                                        data: Some(serde_json::Value::Object(progress_data)),
                                        update_downloaded: Some(false),
                                    };

                                    let _ = app_clone.emit("update-status", progress_status);
                                }
                            },
                            move || {
                                log::info!("Download complete, installing...");

                                let installing_status = UpdateStatus {
                                    event: "update-installing".to_string(),
                                    data: None,
                                    update_downloaded: Some(true),
                                };

                                let _ = app_clone2.emit("update-status", installing_status);
                            }
                        ).await {
                            Ok(_) => {
                                let downloaded_status = UpdateStatus {
                                    event: "update-downloaded".to_string(),
                                    data: None,
                                    update_downloaded: Some(true),
                                };

                                if let Ok(mut status) = state.status.lock() {
                                    *status = Some(downloaded_status.clone());
                                }

                                app.emit("update-status", downloaded_status)
                                    .map_err(|e| format!("Failed to emit event: {}", e))?;
                            }
                            Err(e) => {
                                log::error!("Failed to download update: {}", e);

                                let mut error_data = serde_json::Map::new();
                                error_data.insert("message".to_string(), serde_json::Value::String(e.to_string()));

                                let error_status = UpdateStatus {
                                    event: "update-error".to_string(),
                                    data: Some(serde_json::Value::Object(error_data)),
                                    update_downloaded: None,
                                };

                                if let Ok(mut status) = state.status.lock() {
                                    *status = Some(error_status.clone());
                                }

                                app.emit("update-status", error_status)
                                    .map_err(|e| format!("Failed to emit event: {}", e))?;
                            }
                        }
                    }
                }
                Ok(None) => {
                    log::info!("No update available");

                    let no_update_status = UpdateStatus {
                        event: "update-not-available".to_string(),
                        data: None,
                        update_downloaded: None,
                    };

                    if let Ok(mut status) = state.status.lock() {
                        *status = Some(no_update_status.clone());
                    }

                    app.emit("update-status", no_update_status)
                        .map_err(|e| format!("Failed to emit event: {}", e))?;
                }
                Err(e) => {
                    log::error!("Failed to check for updates: {}", e);

                    let mut error_data = serde_json::Map::new();
                    error_data.insert("message".to_string(), serde_json::Value::String(e.to_string()));

                    let error_status = UpdateStatus {
                        event: "update-error".to_string(),
                        data: Some(serde_json::Value::Object(error_data)),
                        update_downloaded: None,
                    };

                    if let Ok(mut status) = state.status.lock() {
                        *status = Some(error_status.clone());
                    }

                    app.emit("update-status", error_status)
                        .map_err(|e| format!("Failed to emit event: {}", e))?;
                }
            }
        }
        Err(e) => {
            log::error!("Failed to get updater: {}", e);
            return Err(format!("Updater not available: {}", e));
        }
    }

    Ok(())
}

/// Download update manually (requires a previous check_for_updates call that found an update)
#[tauri::command]
pub async fn download_update(
    app: AppHandle,
    state: State<'_, UpdateState>,
) -> Result<(), String> {
    use tauri_plugin_updater::UpdaterExt;

    // Check if we have a cached update
    let cached_update = state.cached_update.lock()
        .map_err(|e| format!("Failed to lock cached update: {}", e))?
        .clone();

    let cached = cached_update.ok_or_else(|| "No update available. Please check for updates first.".to_string())?;

    log::info!("Manually downloading update version {}...", cached.version);

    // Emit downloading status
    let downloading_status = UpdateStatus {
        event: "download-progress".to_string(),
        data: Some(serde_json::json!({
            "percent": 0,
            "version": cached.version.clone()
        })),
        update_downloaded: Some(false),
    };

    if let Ok(mut status) = state.status.lock() {
        *status = Some(downloading_status.clone());
    }

    app.emit("update-status", downloading_status)
        .map_err(|e| format!("Failed to emit event: {}", e))?;

    // Get updater and check for update again
    match app.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(Some(update)) => {
                    // Clone app handle for closures
                    let app_clone = app.clone();
                    let app_clone2 = app.clone();

                    // Download the update with progress tracking
                    let mut downloaded_bytes: usize = 0;
                    match update.download_and_install(
                        move |chunk_length, content_length| {
                            downloaded_bytes += chunk_length;
                            if let Some(total) = content_length {
                                let percent = ((downloaded_bytes as f64 / total as f64) * 100.0) as u32;
                                log::debug!("Download progress: {}%", percent);

                                // Emit progress event
                                let mut progress_data = serde_json::Map::new();
                                progress_data.insert("percent".to_string(), serde_json::Value::Number(percent.into()));
                                progress_data.insert("downloaded".to_string(), serde_json::Value::Number(downloaded_bytes.into()));
                                progress_data.insert("total".to_string(), serde_json::Value::Number(total.into()));

                                let progress_status = UpdateStatus {
                                    event: "download-progress".to_string(),
                                    data: Some(serde_json::Value::Object(progress_data)),
                                    update_downloaded: Some(false),
                                };

                                let _ = app_clone.emit("update-status", progress_status);
                            }
                        },
                        move || {
                            log::info!("Download complete, installing...");

                            let installing_status = UpdateStatus {
                                event: "update-installing".to_string(),
                                data: None,
                                update_downloaded: Some(true),
                            };

                            let _ = app_clone2.emit("update-status", installing_status);
                        }
                    ).await {
                        Ok(_) => {
                            let downloaded_status = UpdateStatus {
                                event: "update-downloaded".to_string(),
                                data: None,
                                update_downloaded: Some(true),
                            };

                            if let Ok(mut status) = state.status.lock() {
                                *status = Some(downloaded_status.clone());
                            }

                            app.emit("update-status", downloaded_status)
                                .map_err(|e| format!("Failed to emit event: {}", e))?;

                            Ok(())
                        }
                        Err(e) => {
                            log::error!("Failed to download update: {}", e);

                            let mut error_data = serde_json::Map::new();
                            error_data.insert("message".to_string(), serde_json::Value::String(e.to_string()));

                            let error_status = UpdateStatus {
                                event: "update-error".to_string(),
                                data: Some(serde_json::Value::Object(error_data)),
                                update_downloaded: None,
                            };

                            if let Ok(mut status) = state.status.lock() {
                                *status = Some(error_status.clone());
                            }

                            app.emit("update-status", error_status.clone())
                                .map_err(|e| format!("Failed to emit event: {}", e))?;

                            Err(format!("Failed to download update: {}", e))
                        }
                    }
                }
                Ok(None) => {
                    Err("No update available".to_string())
                }
                Err(e) => {
                    Err(format!("Failed to check for update: {}", e))
                }
            }
        }
        Err(e) => {
            Err(format!("Updater not available: {}", e))
        }
    }
}

/// Quit and install update
#[tauri::command]
pub async fn quit_and_install(app: AppHandle, state: State<'_, UpdateState>) -> Result<(), String> {
    // Check if an update has been downloaded
    let update_downloaded = if let Ok(status) = state.status.lock() {
        status.as_ref().and_then(|s| s.update_downloaded).unwrap_or(false)
    } else {
        false
    };

    if !update_downloaded {
        return Err("No update has been downloaded yet".to_string());
    }

    log::info!("Quitting and installing update...");

    // The updater plugin will handle the installation and restart
    // We just need to exit the app
    app.exit(0);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Test UpdatePreferences default values
    #[test]
    fn test_update_preferences_defaults() {
        let prefs = UpdatePreferences::default();

        assert!(prefs.auto_download);
        assert!(prefs.auto_install_on_app_quit);
        assert_eq!(prefs.channel, "stable");
        assert!(prefs.check_on_startup);
        assert_eq!(prefs.last_check_time, None);
    }

    /// Test UpdatePreferences serialization with camelCase
    #[test]
    fn test_update_preferences_serde_camelcase() {
        let prefs = UpdatePreferences {
            auto_download: false,
            auto_install_on_app_quit: true,
            channel: "beta".to_string(),
            check_on_startup: false,
            last_check_time: Some(1609459200),
        };

        let json = serde_json::to_string(&prefs).unwrap();

        // Check camelCase formatting
        assert!(json.contains("autoDownload"));
        assert!(json.contains("autoInstallOnAppQuit"));
        assert!(json.contains("checkOnStartup"));
        assert!(json.contains("lastCheckTime"));

        let deserialized: UpdatePreferences = serde_json::from_str(&json).unwrap();
        assert!(!deserialized.auto_download);
        assert_eq!(deserialized.channel, "beta");
        assert_eq!(deserialized.last_check_time, Some(1609459200));
    }

    /// Test UpdatePreferences with different channels
    #[test]
    fn test_update_preferences_channels() {
        let channels = vec!["stable", "beta", "nightly", "dev"];

        for channel in channels {
            let prefs = UpdatePreferences {
                auto_download: true,
                auto_install_on_app_quit: true,
                channel: channel.to_string(),
                check_on_startup: true,
                last_check_time: None,
            };

            assert_eq!(prefs.channel, channel);

            let json = serde_json::to_string(&prefs).unwrap();
            let deserialized: UpdatePreferences = serde_json::from_str(&json).unwrap();
            assert_eq!(deserialized.channel, channel);
        }
    }

    /// Test UpdateStatus structure
    #[test]
    fn test_update_status_structure() {
        let status = UpdateStatus {
            event: "update-available".to_string(),
            data: Some(serde_json::json!({
                "version": "1.2.0",
                "releaseDate": "2025-01-15"
            })),
            update_downloaded: Some(false),
        };

        let json = serde_json::to_string(&status).unwrap();
        let deserialized: UpdateStatus = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.event, "update-available");
        assert_eq!(deserialized.update_downloaded, Some(false));
        assert!(deserialized.data.is_some());
    }

    /// Test UpdateStatus events
    #[test]
    fn test_update_status_events() {
        let events = vec![
            "checking",
            "update-available",
            "update-downloaded",
            "update-installed",
            "not-available",
            "error",
        ];

        for event in events {
            let status = UpdateStatus {
                event: event.to_string(),
                data: None,
                update_downloaded: None,
            };

            assert_eq!(status.event, event);

            let json = serde_json::to_string(&status).unwrap();
            let deserialized: UpdateStatus = serde_json::from_str(&json).unwrap();
            assert_eq!(deserialized.event, event);
        }
    }

    /// Test UpdateStatus with null/None values
    #[test]
    fn test_update_status_with_none() {
        let status = UpdateStatus {
            event: "checking".to_string(),
            data: None,
            update_downloaded: None,
        };

        let json = serde_json::to_string(&status).unwrap();
        let deserialized: UpdateStatus = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.event, "checking");
        assert!(deserialized.data.is_none());
        assert!(deserialized.update_downloaded.is_none());
    }

    /// Test UpdateState default
    #[test]
    fn test_update_state_default() {
        let state = UpdateState::default();

        let prefs = state.preferences.lock().unwrap();
        assert!(prefs.auto_download);
        assert_eq!(prefs.channel, "stable");

        drop(prefs);

        let status = state.status.lock().unwrap();
        assert!(status.is_none());
    }

    /// Test UpdatePreferences timestamp handling
    #[test]
    fn test_update_preferences_timestamp() {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let prefs = UpdatePreferences {
            auto_download: true,
            auto_install_on_app_quit: true,
            channel: "stable".to_string(),
            check_on_startup: true,
            last_check_time: Some(now),
        };

        let json = serde_json::to_string(&prefs).unwrap();
        let deserialized: UpdatePreferences = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.last_check_time, Some(now));
    }

    /// Test UpdateStatus with complex data
    #[test]
    fn test_update_status_complex_data() {
        let data = serde_json::json!({
            "version": "2.0.0",
            "releaseNotes": "Major update with new features",
            "size": 52428800,
            "url": "https://example.com/update.zip",
            "signature": "abc123..."
        });

        let status = UpdateStatus {
            event: "update-available".to_string(),
            data: Some(data.clone()),
            update_downloaded: Some(false),
        };

        let json = serde_json::to_string(&status).unwrap();
        let deserialized: UpdateStatus = serde_json::from_str(&json).unwrap();

        assert!(deserialized.data.is_some());
        let deserialized_data = deserialized.data.unwrap();
        assert_eq!(deserialized_data["version"], "2.0.0");
        assert_eq!(deserialized_data["size"], 52428800);
    }

    /// Test UpdatePreferences with all options disabled
    #[test]
    fn test_update_preferences_all_disabled() {
        let prefs = UpdatePreferences {
            auto_download: false,
            auto_install_on_app_quit: false,
            channel: "stable".to_string(),
            check_on_startup: false,
            last_check_time: None,
        };

        assert!(!prefs.auto_download);
        assert!(!prefs.auto_install_on_app_quit);
        assert!(!prefs.check_on_startup);
    }
}

