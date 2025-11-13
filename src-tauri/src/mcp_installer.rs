use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::PathBuf, process::{Command, Stdio, Child}, sync::{Mutex, OnceLock}};
use tauri::{AppHandle, Manager};

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyInfo { pub name: String, pub required: bool, pub installed: bool, pub install_path: Option<String> }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum InstallationStatus { Pending, Downloading, Installing, Configuring, Completed, Failed, Cancelled }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallationProgress { pub install_id: String, pub status: InstallationStatus, pub progress: u8, pub message: String, pub current_step: Option<String>, pub total_steps: Option<u32>, pub current_step_number: Option<u32>, pub started_at: String, pub completed_at: Option<String>, pub error: Option<String>, pub logs: Option<Vec<String>> }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallationValidation { pub valid: bool, pub errors: Vec<String>, pub warnings: Vec<String>, pub dependencies: Vec<DependencyInfo>, pub estimated_size: Option<u64>, pub estimated_time: Option<u64> }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallMetadata {
    pub server_id: String,
    pub install_id: String,
    pub source_type: String,
    pub install_path: String,
    pub package_name: Option<String>,
    pub repository: Option<String>,
    pub version: Option<String>,
    pub installed_at: String,
    /// IDE/client type that installed this server (e.g., "claude-desktop", "vscode", "cline", "mcp-hub")
    #[serde(default)]
    pub client_type: Option<String>,
    /// Original configuration JSON for potential reconstruction or export
    #[serde(default)]
    pub original_config: Option<String>,
    /// Path to the IDE config file this was imported from
    #[serde(default)]
    pub config_source_path: Option<String>,
}

static INSTALLS: OnceLock<Mutex<HashMap<String, InstallationProgress>>> = OnceLock::new();
static INSTALL_METADATA: OnceLock<Mutex<HashMap<String, InstallMetadata>>> = OnceLock::new();
static INSTALL_PROCESSES: OnceLock<Mutex<HashMap<String, Child>>> = OnceLock::new();

fn installs() -> &'static Mutex<HashMap<String, InstallationProgress>> { INSTALLS.get_or_init(|| Mutex::new(HashMap::new())) }
pub fn install_metadata() -> &'static Mutex<HashMap<String, InstallMetadata>> { INSTALL_METADATA.get_or_init(|| Mutex::new(HashMap::new())) }
fn install_processes() -> &'static Mutex<HashMap<String, Child>> { INSTALL_PROCESSES.get_or_init(|| Mutex::new(HashMap::new())) }

fn now_iso() -> String { chrono::Utc::now().to_rfc3339() }

fn npm_available() -> bool { Command::new("npm").arg("--version").stdout(Stdio::null()).stderr(Stdio::null()).status().map(|s| s.success()).unwrap_or(false) }
fn git_available() -> bool { Command::new("git").arg("--version").stdout(Stdio::null()).stderr(Stdio::null()).status().map(|s| s.success()).unwrap_or(false) }

#[tauri::command]
pub fn validate_install(config: InstallConfig) -> Result<InstallationValidation, String> {
    let mut res = InstallationValidation { valid: true, errors: vec![], warnings: vec![], dependencies: vec![], estimated_size: None, estimated_time: None };
    match &config {
        InstallConfig::Npm { package_name, .. } => {
            let re = regex::Regex::new(r"^(@[a-z0-9-~][a-z0-9-._~]*/)?[a-z0-9-~][a-z0-9-._~]*$").unwrap();
            if !re.is_match(package_name) { res.valid=false; res.errors.push("Invalid npm package name".into()); }
            let npm = npm_available();
            if !npm { res.valid=false; res.errors.push("npm is not available on PATH".into()); }
            else { res.dependencies.push(DependencyInfo{ name:"npm".into(), required:true, installed:true, install_path:None}); }
            res.estimated_size=Some(10*1024*1024); res.estimated_time=Some(30);
        }
        InstallConfig::GitHub { repository, .. } => {
            let re = regex::Regex::new(r"^[A-Za-z0-9_-]+/[A-Za-z0-9_.-]+$").unwrap();
            if !re.is_match(repository) { res.valid=false; res.errors.push("Invalid GitHub repository format (owner/repo)".into()); }
            let git = git_available();
            if !git { res.valid=false; res.errors.push("git is not available on PATH".into()); }
            else { res.dependencies.push(DependencyInfo{ name:"git".into(), required:true, installed:true, install_path:None}); }
            res.estimated_size=Some(50*1024*1024); res.estimated_time=Some(60);
        }
        InstallConfig::Local { path, .. } => {
            let pb = PathBuf::from(path);
            if !pb.exists() || !pb.is_dir() { res.valid=false; res.errors.push("Path must exist and be a directory".into()); }
            res.estimated_size=Some(0); res.estimated_time=Some(1);
        }
    }
    Ok(res)
}

#[tauri::command]
pub fn install_server(app: AppHandle, config: InstallConfig, _server_name: String, _server_description: Option<String>) -> Result<(String, InstallationProgress), String> {
    let install_id = nanoid::nanoid!();
    let progress = InstallationProgress{ install_id: install_id.clone(), status: InstallationStatus::Pending, progress: 0, message:"Preparing installation".into(), current_step: None, total_steps: None, current_step_number: None, started_at: now_iso(), completed_at: None, error: None, logs: Some(vec![]) };
    installs().lock().map_err(|_|"Lock poisoned")?.insert(install_id.clone(), progress.clone());

    // Spawn background thread to perform install
    let id_for_thread = install_id.clone();
    std::thread::spawn(move || {
        if let Err(e) = do_install(app, id_for_thread.clone(), config) {
            // Report error in progress tracking
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

    let current = installs().lock().unwrap().get(&install_id).cloned().unwrap();
    Ok((install_id, current))
}

fn update(install_id: &str, patch: impl FnOnce(&mut InstallationProgress)) { if let Ok(mut map)=installs().lock(){ if let Some(p)=map.get_mut(install_id){ patch(p); } } }

/// Helper function to persist metadata to disk
fn persist_metadata(app: &AppHandle) {
    // Get all metadata
    if let Ok(meta_map) = install_metadata().lock() {
        let metadata_vec: Vec<InstallMetadata> = meta_map.values().cloned().collect();
        if let Ok(json) = serde_json::to_string(&metadata_vec) {
            // Use async invoke to save without blocking
            let app_clone = app.clone();
            std::thread::spawn(move || {
                if let Err(e) = crate::storage::save_installation_metadata(app_clone, json) {
                    log::error!("Failed to persist installation metadata: {}", e);
                }
            });
        }
    }
}

fn do_install(app: AppHandle, install_id: String, config: InstallConfig) -> Result<(), String> {
    match config {
        InstallConfig::Npm { package_name, version, global, registry } => {
            update(&install_id, |p| { p.status=InstallationStatus::Downloading; p.progress=10; p.message=format!("Downloading {}...", package_name); p.current_step=Some("Downloading".into()); p.total_steps=Some(3); p.current_step_number=Some(1); });
            // target dir under app data
            let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            let target = if global.unwrap_or(false) { dir.clone() } else { dir.join("mcp_servers").join("npm").join(package_name.replace("/","-")) };
            std::fs::create_dir_all(&target).map_err(|e| e.to_string())?;

            let mut args: Vec<String> = vec!["install".into(), if let Some(ref v)=version { format!("{}@{}", package_name, v) } else { package_name.clone() } ];
            if !global.unwrap_or(false) { args.push("--prefix".into()); args.push(target.to_string_lossy().to_string()); }
            if let Some(reg) = registry { args.push("--registry".into()); args.push(reg); }

            let status = Command::new("npm").args(&args).stdout(Stdio::piped()).stderr(Stdio::piped()).status().map_err(|e| e.to_string())?;
            if !status.success() { update(&install_id, |p| { p.status=InstallationStatus::Failed; p.progress=0; p.message="Installation failed".into(); p.error=Some(format!("npm exited with status {:?}", status.code())); p.completed_at=Some(now_iso()); }); return Err("npm install failed".into()); }

            update(&install_id, |p| { p.status=InstallationStatus::Configuring; p.progress=80; p.message="Configuring server...".into(); p.current_step=Some("Configuring".into()); p.current_step_number=Some(2); });

            // Save installation metadata
            let metadata = InstallMetadata {
                server_id: install_id.clone(),
                install_id: install_id.clone(),
                source_type: "npm".to_string(),
                install_path: target.to_string_lossy().to_string(),
                package_name: Some(package_name),
                repository: None,
                version,
                installed_at: now_iso(),
                client_type: Some("mcp-hub".to_string()),
                original_config: None,
                config_source_path: None,
            };
            if let Ok(mut meta) = install_metadata().lock() {
                meta.insert(install_id.clone(), metadata);
            }

            // Persist metadata to disk
            persist_metadata(&app);

            update(&install_id, |p| { p.status=InstallationStatus::Completed; p.progress=100; p.message="Installation completed successfully".into(); p.current_step=Some("Completed".into()); p.current_step_number=Some(3); p.completed_at=Some(now_iso()); });
            Ok(())
        }
        InstallConfig::GitHub { repository, branch, tag, commit:_, sub_path:_ } => {
            update(&install_id, |p| { p.status=InstallationStatus::Downloading; p.progress=10; p.message=format!("Cloning {}...", repository); p.current_step=Some("Cloning".into()); p.total_steps=Some(4); p.current_step_number=Some(1); });
            let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            let target = dir.join("mcp_servers").join("github").join(repository.split('/').next_back().unwrap_or("repo"));
            std::fs::create_dir_all(&target).map_err(|e| e.to_string())?;

            let mut args = vec!["clone".to_string(), format!("https://github.com/{}.git", repository), target.to_string_lossy().to_string(), "--depth".into(), "1".into()];
            if let Some(ref b) = branch { args.push("--branch".into()); args.push(b.clone()); }
            if let Some(ref t) = tag { args.push("--branch".into()); args.push(t.clone()); }

            let status = Command::new("git").args(&args).stdout(Stdio::piped()).stderr(Stdio::piped()).status().map_err(|e| e.to_string())?;
            if !status.success() { update(&install_id, |p| { p.status=InstallationStatus::Failed; p.progress=0; p.message="Clone failed".into(); p.error=Some(format!("git exited with status {:?}", status.code())); p.completed_at=Some(now_iso()); }); return Err("git clone failed".into()); }

            update(&install_id, |p| { p.status=InstallationStatus::Installing; p.progress=60; p.message="Installing dependencies...".into(); p.current_step=Some("Installing deps".into()); p.current_step_number=Some(3); });
            // Best-effort npm install if package.json exists
            let pkg = target.join("package.json");
            if pkg.exists() { let _ = Command::new("npm").arg("install").current_dir(&target).status(); }

            // Save installation metadata
            let metadata = InstallMetadata {
                server_id: install_id.clone(),
                install_id: install_id.clone(),
                source_type: "github".to_string(),
                install_path: target.to_string_lossy().to_string(),
                package_name: None,
                repository: Some(repository),
                version: tag.or(branch),
                installed_at: now_iso(),
                client_type: Some("mcp-hub".to_string()),
                original_config: None,
                config_source_path: None,
            };
            if let Ok(mut meta) = install_metadata().lock() {
                meta.insert(install_id.clone(), metadata);
            }

            // Persist metadata to disk
            persist_metadata(&app);

            update(&install_id, |p| { p.status=InstallationStatus::Completed; p.progress=100; p.message="Installation completed successfully".into(); p.current_step=Some("Completed".into()); p.current_step_number=Some(4); p.completed_at=Some(now_iso()); });
            Ok(())
        }
        InstallConfig::Local { path, .. } => {
            let pb = PathBuf::from(&path);
            if !pb.exists() || !pb.is_dir() { update(&install_id, |p| { p.status=InstallationStatus::Failed; p.progress=0; p.message="Invalid local path".into(); p.error=Some("Path must exist and be directory".into()); p.completed_at=Some(now_iso()); }); return Err("invalid path".into()); }
            update(&install_id, |p| { p.status=InstallationStatus::Configuring; p.progress=50; p.message="Configuring local server...".into(); p.current_step=Some("Configuring".into()); p.total_steps=Some(2); p.current_step_number=Some(1); });

            // Save installation metadata
            let metadata = InstallMetadata {
                server_id: install_id.clone(),
                install_id: install_id.clone(),
                source_type: "local".to_string(),
                install_path: path.clone(),
                package_name: None,
                repository: None,
                version: None,
                installed_at: now_iso(),
                client_type: Some("mcp-hub".to_string()),
                original_config: None,
                config_source_path: None,
            };
            if let Ok(mut meta) = install_metadata().lock() {
                meta.insert(install_id.clone(), metadata);
            }

            // Persist metadata to disk
            persist_metadata(&app);

            update(&install_id, |p| { p.status=InstallationStatus::Completed; p.progress=100; p.message="Local server configured".into(); p.current_step=Some("Completed".into()); p.current_step_number=Some(2); p.completed_at=Some(now_iso()); });
            Ok(())
        }
    }
}

#[tauri::command]
pub fn get_install_progress(install_id: String) -> Result<InstallationProgress, String> {
    installs().lock().map_err(|_|"Lock poisoned")?.get(&install_id).cloned().ok_or_else(||"Installation not found".into())
}

#[tauri::command]
pub fn cancel_install(install_id: String) -> Result<(), String> {
    update(&install_id, |p| { p.status=InstallationStatus::Cancelled; p.message="Installation cancelled".into(); p.completed_at=Some(now_iso()); });
    Ok(())
}

#[tauri::command]
pub fn cleanup_install(install_id: String) -> Result<(), String> {
    installs().lock().map_err(|_|"Lock poisoned")?.remove(&install_id);
    Ok(())
}

#[tauri::command]
pub fn get_installation_metadata(install_id: String) -> Result<Option<InstallMetadata>, String> {
    let metadata = install_metadata()
        .lock()
        .map_err(|_| "Lock poisoned".to_string())?
        .get(&install_id)
        .cloned();
    Ok(metadata)
}

#[tauri::command]
pub fn uninstall_server(
    app: AppHandle,
    install_id: String,
    server_id: Option<String>,
    stop_process: Option<bool>
) -> Result<(), String> {
    log::info!("Uninstalling server: install_id={}", install_id);

    // Get installation metadata to know what to delete
    let metadata = {
        let meta_map = install_metadata()
            .lock()
            .map_err(|_| "Lock poisoned".to_string())?;
        meta_map
            .get(&install_id)
            .cloned()
            .ok_or_else(|| format!("Installation metadata not found for install_id: {}", install_id))?
    };

    // Stop the server process if requested and server_id is provided
    if stop_process.unwrap_or(true) {
        if let Some(sid) = server_id.as_ref() {
            log::info!("Stopping server {} before uninstall", sid);
            // Try to stop, but don't fail uninstall if stop fails
            let _ = crate::mcp_lifecycle::mcp_stop_server(sid.clone(), Some(false));
        }
    }

    // Uninstall based on source type
    match metadata.source_type.as_str() {
        "npm" => {
            log::info!("Uninstalling npm package at: {}", metadata.install_path);

            // For npm packages, we can either:
            // 1. Run npm uninstall (cleaner but requires npm)
            // 2. Just delete the directory (simpler, always works)

            // Try npm uninstall first if package_name is available
            if let Some(pkg) = metadata.package_name {
                let uninstall_result = Command::new("npm")
                    .args(["uninstall", &pkg, "--prefix", &metadata.install_path])
                    .stdout(Stdio::piped())
                    .stderr(Stdio::piped())
                    .status();

                match uninstall_result {
                    Ok(status) if status.success() => {
                        log::info!("Successfully uninstalled npm package: {}", pkg);
                    }
                    _ => {
                        log::warn!("npm uninstall failed, falling back to directory deletion");
                    }
                }
            }

            // Always delete the directory to ensure complete cleanup
            let path = PathBuf::from(&metadata.install_path);
            if path.exists() {
                std::fs::remove_dir_all(&path)
                    .map_err(|e| format!("Failed to delete npm installation directory: {}", e))?;
                log::info!("Deleted npm installation directory: {}", metadata.install_path);
            }
        }

        "github" => {
            log::info!("Uninstalling GitHub repository at: {}", metadata.install_path);

            let path = PathBuf::from(&metadata.install_path);
            if path.exists() {
                std::fs::remove_dir_all(&path)
                    .map_err(|e| format!("Failed to delete GitHub repository: {}", e))?;
                log::info!("Deleted GitHub repository: {}", metadata.install_path);
            } else {
                log::warn!("GitHub repository path does not exist: {}", metadata.install_path);
            }
        }

        "local" => {
            log::info!("Removing local server reference (not deleting user files): {}", metadata.install_path);
            // For local installations, we don't delete the actual files
            // Just remove the metadata reference
            // The user's files remain untouched
        }

        other => {
            return Err(format!("Unknown installation source type: {}", other));
        }
    }

    // Remove installation metadata
    install_metadata()
        .lock()
        .map_err(|_| "Lock poisoned".to_string())?
        .remove(&install_id);

    // Remove installation progress tracking if it exists
    if let Ok(mut installs_map) = installs().lock() {
        installs_map.remove(&install_id);
    }

    // Remove process handle if it exists
    if let Ok(mut procs) = install_processes().lock() {
        procs.remove(&install_id);
    }

    // Persist metadata to disk after removal
    persist_metadata(&app);

    log::info!("Successfully uninstalled server: {}", install_id);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Test InstallMetadata serialization/deserialization
    #[test]
    fn test_install_metadata_serde_npm() {
        let metadata = InstallMetadata {
            server_id: "test-server".to_string(),
            install_id: "test-install-123".to_string(),
            source_type: "npm".to_string(),
            install_path: "/path/to/install".to_string(),
            package_name: Some("@scope/package".to_string()),
            repository: None,
            version: Some("1.0.0".to_string()),
            installed_at: "2025-01-01T00:00:00Z".to_string(),
            client_type: Some("mcp-hub".to_string()),
            original_config: None,
            config_source_path: None,
        };

        // Serialize to JSON
        let json = serde_json::to_string(&metadata).unwrap();

        // Deserialize back
        let deserialized: InstallMetadata = serde_json::from_str(&json).unwrap();

        // Verify all fields match
        assert_eq!(deserialized.server_id, "test-server");
        assert_eq!(deserialized.install_id, "test-install-123");
        assert_eq!(deserialized.source_type, "npm");
        assert_eq!(deserialized.install_path, "/path/to/install");
        assert_eq!(deserialized.package_name, Some("@scope/package".to_string()));
        assert_eq!(deserialized.repository, None);
        assert_eq!(deserialized.version, Some("1.0.0".to_string()));
        assert_eq!(deserialized.installed_at, "2025-01-01T00:00:00Z");
    }

    /// Test InstallMetadata serialization for GitHub source
    #[test]
    fn test_install_metadata_serde_github() {
        let metadata = InstallMetadata {
            server_id: "test-server".to_string(),
            install_id: "test-install-456".to_string(),
            source_type: "github".to_string(),
            install_path: "/path/to/repo".to_string(),
            package_name: None,
            repository: Some("owner/repo".to_string()),
            version: Some("v1.0.0".to_string()),
            installed_at: "2025-01-01T00:00:00Z".to_string(),
            client_type: Some("mcp-hub".to_string()),
            original_config: None,
            config_source_path: None,
        };

        let json = serde_json::to_string(&metadata).unwrap();
        let deserialized: InstallMetadata = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.source_type, "github");
        assert_eq!(deserialized.repository, Some("owner/repo".to_string()));
        assert_eq!(deserialized.package_name, None);
    }

    /// Test InstallMetadata serialization for local source
    #[test]
    fn test_install_metadata_serde_local() {
        let metadata = InstallMetadata {
            server_id: "test-server".to_string(),
            install_id: "test-install-789".to_string(),
            source_type: "local".to_string(),
            install_path: "/path/to/local".to_string(),
            package_name: None,
            repository: None,
            version: None,
            installed_at: "2025-01-01T00:00:00Z".to_string(),
            client_type: Some("mcp-hub".to_string()),
            original_config: None,
            config_source_path: None,
        };

        let json = serde_json::to_string(&metadata).unwrap();
        let deserialized: InstallMetadata = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.source_type, "local");
        assert_eq!(deserialized.package_name, None);
        assert_eq!(deserialized.repository, None);
        assert_eq!(deserialized.version, None);
    }

    /// Test metadata storage and retrieval
    #[test]
    #[serial_test::serial]
    fn test_metadata_storage_and_retrieval() {
        let metadata = InstallMetadata {
            server_id: "server-001".to_string(),
            install_id: "install-001".to_string(),
            source_type: "npm".to_string(),
            install_path: "/test/path".to_string(),
            package_name: Some("test-package".to_string()),
            repository: None,
            version: Some("2.0.0".to_string()),
            installed_at: now_iso(),
            client_type: Some("mcp-hub".to_string()),
            original_config: None,
            config_source_path: None,
        };

        // Store metadata
        {
            let mut meta_map = install_metadata().lock().unwrap();
            meta_map.insert("install-001".to_string(), metadata.clone());
        }

        // Retrieve metadata
        let result = get_installation_metadata("install-001".to_string());
        assert!(result.is_ok());

        let retrieved = result.unwrap();
        assert!(retrieved.is_some());

        let retrieved_metadata = retrieved.unwrap();
        assert_eq!(retrieved_metadata.install_id, "install-001");
        assert_eq!(retrieved_metadata.source_type, "npm");
        assert_eq!(retrieved_metadata.package_name, Some("test-package".to_string()));

        // Clean up
        {
            let mut meta_map = install_metadata().lock().unwrap();
            meta_map.remove("install-001");
        }
    }

    /// Test get_installation_metadata with non-existent install_id
    #[test]
    #[serial_test::serial]
    fn test_get_installation_metadata_not_found() {
        let result = get_installation_metadata("non-existent-id".to_string());
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }

    /// Test InstallConfig enum serialization for npm
    #[test]
    fn test_install_config_serde_npm() {
        let config = InstallConfig::Npm {
            package_name: "express".to_string(),
            version: Some("4.18.0".to_string()),
            global: Some(false),
            registry: Some("https://registry.npmjs.org".to_string()),
        };

        let json = serde_json::to_string(&config).unwrap();
        assert!(json.contains("\"source\":\"npm\""));
        assert!(json.contains("\"package_name\":\"express\""));

        let deserialized: InstallConfig = serde_json::from_str(&json).unwrap();
        if let InstallConfig::Npm { package_name, version, global, registry } = deserialized {
            assert_eq!(package_name, "express");
            assert_eq!(version, Some("4.18.0".to_string()));
            assert_eq!(global, Some(false));
            assert_eq!(registry, Some("https://registry.npmjs.org".to_string()));
        } else {
            panic!("Expected Npm variant");
        }
    }

    /// Test InstallConfig enum serialization for GitHub
    #[test]
    fn test_install_config_serde_github() {
        let config = InstallConfig::GitHub {
            repository: "modelcontextprotocol/servers".to_string(),
            branch: Some("main".to_string()),
            tag: None,
            commit: None,
            sub_path: Some("src/sqlite".to_string()),
        };

        let json = serde_json::to_string(&config).unwrap();
        assert!(json.contains("\"source\":\"github\""));

        let deserialized: InstallConfig = serde_json::from_str(&json).unwrap();
        if let InstallConfig::GitHub { repository, branch, tag, commit, sub_path } = deserialized {
            assert_eq!(repository, "modelcontextprotocol/servers");
            assert_eq!(branch, Some("main".to_string()));
            assert_eq!(tag, None);
            assert_eq!(commit, None);
            assert_eq!(sub_path, Some("src/sqlite".to_string()));
        } else {
            panic!("Expected GitHub variant");
        }
    }

    /// Test InstallConfig enum serialization for Local
    #[test]
    fn test_install_config_serde_local() {
        let config = InstallConfig::Local {
            path: "/home/user/my-server".to_string(),
            validate: Some(true),
        };

        let json = serde_json::to_string(&config).unwrap();
        assert!(json.contains("\"source\":\"local\""));

        let deserialized: InstallConfig = serde_json::from_str(&json).unwrap();
        if let InstallConfig::Local { path, validate } = deserialized {
            assert_eq!(path, "/home/user/my-server");
            assert_eq!(validate, Some(true));
        } else {
            panic!("Expected Local variant");
        }
    }

    /// Test InstallationStatus enum values
    #[test]
    fn test_installation_status_values() {
        let statuses = vec![
            InstallationStatus::Pending,
            InstallationStatus::Downloading,
            InstallationStatus::Installing,
            InstallationStatus::Configuring,
            InstallationStatus::Completed,
            InstallationStatus::Failed,
            InstallationStatus::Cancelled,
        ];

        for status in statuses {
            let json = serde_json::to_string(&status).unwrap();
            let _deserialized: InstallationStatus = serde_json::from_str(&json).unwrap();
        }
    }

    /// Test InstallationProgress structure
    #[test]
    fn test_installation_progress_structure() {
        let progress = InstallationProgress {
            install_id: "test-123".to_string(),
            status: InstallationStatus::Installing,
            progress: 50,
            message: "Installing dependencies...".to_string(),
            current_step: Some("Installing".to_string()),
            total_steps: Some(3),
            current_step_number: Some(2),
            started_at: now_iso(),
            completed_at: None,
            error: None,
            logs: Some(vec!["Log line 1".to_string(), "Log line 2".to_string()]),
        };

        let json = serde_json::to_string(&progress).unwrap();
        let deserialized: InstallationProgress = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.install_id, "test-123");
        assert_eq!(deserialized.progress, 50);
        assert_eq!(deserialized.total_steps, Some(3));
        assert_eq!(deserialized.current_step_number, Some(2));
        assert_eq!(deserialized.logs.as_ref().unwrap().len(), 2);
    }

    /// Test validate_install for valid npm package
    #[test]
    fn test_validate_install_npm_valid() {
        let config = InstallConfig::Npm {
            package_name: "express".to_string(),
            version: None,
            global: None,
            registry: None,
        };

        let result = validate_install(config);
        assert!(result.is_ok());

        let validation = result.unwrap();
        // Package name validation should pass
        assert!(!validation.errors.iter().any(|e| e.contains("Invalid npm package name")));
        assert!(validation.estimated_size.is_some());
        assert!(validation.estimated_time.is_some());
    }

    /// Test validate_install for invalid npm package name
    #[test]
    fn test_validate_install_npm_invalid() {
        let config = InstallConfig::Npm {
            package_name: "Invalid Package Name!".to_string(),
            version: None,
            global: None,
            registry: None,
        };

        let result = validate_install(config);
        assert!(result.is_ok());

        let validation = result.unwrap();
        assert!(!validation.valid);
        assert!(validation.errors.iter().any(|e| e.contains("Invalid npm package name")));
    }

    /// Test validate_install for valid scoped npm package
    #[test]
    fn test_validate_install_npm_scoped() {
        let config = InstallConfig::Npm {
            package_name: "@modelcontextprotocol/server-sqlite".to_string(),
            version: Some("1.0.0".to_string()),
            global: None,
            registry: None,
        };

        let result = validate_install(config);
        assert!(result.is_ok());

        let validation = result.unwrap();
        assert!(!validation.errors.iter().any(|e| e.contains("Invalid npm package name")));
    }

    /// Test validate_install for valid GitHub repository
    #[test]
    fn test_validate_install_github_valid() {
        let config = InstallConfig::GitHub {
            repository: "modelcontextprotocol/servers".to_string(),
            branch: None,
            tag: None,
            commit: None,
            sub_path: None,
        };

        let result = validate_install(config);
        assert!(result.is_ok());

        let validation = result.unwrap();
        assert!(!validation.errors.iter().any(|e| e.contains("Invalid GitHub repository format")));
        assert!(validation.estimated_size.is_some());
    }

    /// Test validate_install for invalid GitHub repository format
    #[test]
    fn test_validate_install_github_invalid() {
        let config = InstallConfig::GitHub {
            repository: "invalid-repo-format".to_string(),
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

    /// Test validate_install for local path (non-existent)
    #[test]
    fn test_validate_install_local_invalid_path() {
        let config = InstallConfig::Local {
            path: "/non/existent/path/12345".to_string(),
            validate: Some(true),
        };

        let result = validate_install(config);
        assert!(result.is_ok());

        let validation = result.unwrap();
        assert!(!validation.valid);
        assert!(validation.errors.iter().any(|e| e.contains("Path must exist")));
    }

    /// Test validate_install for local path (valid)
    #[test]
    fn test_validate_install_local_valid() {
        use tempfile::tempdir;

        let temp_dir = tempdir().unwrap();
        let path = temp_dir.path().to_string_lossy().to_string();

        let config = InstallConfig::Local {
            path: path.clone(),
            validate: Some(true),
        };

        let result = validate_install(config);
        assert!(result.is_ok());

        let validation = result.unwrap();
        assert!(validation.valid);
        assert!(validation.errors.is_empty());
        assert_eq!(validation.estimated_size, Some(0));
        assert_eq!(validation.estimated_time, Some(1));

        // Temp dir cleanup happens automatically
    }

    /// Test DependencyInfo structure
    #[test]
    fn test_dependency_info_structure() {
        let dep = DependencyInfo {
            name: "npm".to_string(),
            required: true,
            installed: true,
            install_path: Some("/usr/local/bin/npm".to_string()),
        };

        let json = serde_json::to_string(&dep).unwrap();
        let deserialized: DependencyInfo = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.name, "npm");
        assert!(deserialized.required);
        assert!(deserialized.installed);
        assert_eq!(deserialized.install_path, Some("/usr/local/bin/npm".to_string()));
    }

    /// Test InstallationValidation structure
    #[test]
    fn test_installation_validation_structure() {
        let validation = InstallationValidation {
            valid: true,
            errors: vec![],
            warnings: vec!["Warning message".to_string()],
            dependencies: vec![
                DependencyInfo {
                    name: "npm".to_string(),
                    required: true,
                    installed: true,
                    install_path: None,
                }
            ],
            estimated_size: Some(10485760),
            estimated_time: Some(30),
        };

        let json = serde_json::to_string(&validation).unwrap();
        let deserialized: InstallationValidation = serde_json::from_str(&json).unwrap();

        assert!(deserialized.valid);
        assert_eq!(deserialized.warnings.len(), 1);
        assert_eq!(deserialized.dependencies.len(), 1);
        assert_eq!(deserialized.estimated_size, Some(10485760));
    }

    /// Test RFC3339 timestamp format
    #[test]
    fn test_now_iso_format() {
        let timestamp = now_iso();

        // Should be parseable as RFC3339
        let parsed = chrono::DateTime::parse_from_rfc3339(&timestamp);
        assert!(parsed.is_ok());

        // Should contain expected format elements
        assert!(timestamp.contains('T'));
        assert!(timestamp.contains('Z') || timestamp.contains('+') || timestamp.contains('-'));
    }

    /// Test metadata persistence vector serialization
    #[test]
    #[serial_test::serial]
    fn test_metadata_vector_serialization() {
        // Create multiple metadata entries
        let metadata1 = InstallMetadata {
            server_id: "server-1".to_string(),
            install_id: "install-1".to_string(),
            source_type: "npm".to_string(),
            install_path: "/path/1".to_string(),
            package_name: Some("pkg1".to_string()),
            repository: None,
            version: Some("1.0.0".to_string()),
            installed_at: now_iso(),
            client_type: Some("mcp-hub".to_string()),
            original_config: None,
            config_source_path: None,
        };

        let metadata2 = InstallMetadata {
            server_id: "server-2".to_string(),
            install_id: "install-2".to_string(),
            source_type: "github".to_string(),
            install_path: "/path/2".to_string(),
            package_name: None,
            repository: Some("owner/repo".to_string()),
            version: None,
            installed_at: now_iso(),
            client_type: Some("mcp-hub".to_string()),
            original_config: None,
            config_source_path: None,
        };

        let metadata_vec = vec![metadata1, metadata2];

        // Serialize to JSON
        let json = serde_json::to_string(&metadata_vec).unwrap();

        // Deserialize back
        let deserialized: Vec<InstallMetadata> = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.len(), 2);
        assert_eq!(deserialized[0].source_type, "npm");
        assert_eq!(deserialized[1].source_type, "github");
    }
}
