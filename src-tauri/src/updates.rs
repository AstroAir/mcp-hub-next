use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

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

/// App state for managing update preferences
pub struct UpdateState {
    pub preferences: Mutex<UpdatePreferences>,
    pub status: Mutex<Option<UpdateStatus>>,
}

impl Default for UpdateState {
    fn default() -> Self {
        Self {
            preferences: Mutex::new(UpdatePreferences::default()),
            status: Mutex::new(None),
        }
    }
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
    state: State<'_, UpdateState>,
) -> Result<UpdatePreferences, String> {
    state
        .preferences
        .lock()
        .map(|prefs| prefs.clone())
        .map_err(|e| format!("Failed to get preferences: {}", e))
}

/// Set update preferences
#[tauri::command]
pub fn set_update_preferences(
    state: State<'_, UpdateState>,
    preferences: UpdatePreferences,
) -> Result<(), String> {
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
        prefs.last_check_time = Some(
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        );
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

                    if auto_download {
                        log::info!("Auto-downloading update...");

                        // Download the update
                        match update.download_and_install(|chunk_length, content_length| {
                                if let Some(total) = content_length {
                                    let percent = (chunk_length as f64 / total as f64 * 100.0) as u32;
                                    log::debug!("Download progress: {}%", percent);
                                }
                            }, || {
                                log::info!("Download complete, installing...");
                            }).await {
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

