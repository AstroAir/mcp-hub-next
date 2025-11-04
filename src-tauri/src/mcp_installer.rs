use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::PathBuf, process::{Command, Stdio}, sync::{Mutex, OnceLock}};
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

static INSTALLS: OnceLock<Mutex<HashMap<String, InstallationProgress>>> = OnceLock::new();

fn installs() -> &'static Mutex<HashMap<String, InstallationProgress>> { INSTALLS.get_or_init(|| Mutex::new(HashMap::new())) }

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
        let _ = do_install(app, id_for_thread, config);
    });

    let current = installs().lock().unwrap().get(&install_id).cloned().unwrap();
    Ok((install_id, current))
}

fn update(install_id: &str, patch: impl FnOnce(&mut InstallationProgress)) { if let Ok(mut map)=installs().lock(){ if let Some(p)=map.get_mut(install_id){ patch(p); } } }

fn do_install(app: AppHandle, install_id: String, config: InstallConfig) -> Result<(), String> {
    match config {
        InstallConfig::Npm { package_name, version, global, registry } => {
            update(&install_id, |p| { p.status=InstallationStatus::Downloading; p.progress=10; p.message=format!("Downloading {}...", package_name); p.current_step=Some("Downloading".into()); p.total_steps=Some(3); p.current_step_number=Some(1); });
            // target dir under app data
            let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            let target = if global.unwrap_or(false) { dir.clone() } else { dir.join("mcp_servers").join("npm").join(package_name.replace("/","-")) };
            std::fs::create_dir_all(&target).map_err(|e| e.to_string())?;

            let mut args: Vec<String> = vec!["install".into(), if let Some(v)=version { format!("{}@{}", package_name, v) } else { package_name } ];
            if !global.unwrap_or(false) { args.push("--prefix".into()); args.push(target.to_string_lossy().to_string()); }
            if let Some(reg) = registry { args.push("--registry".into()); args.push(reg); }

            let status = Command::new("npm").args(&args).stdout(Stdio::piped()).stderr(Stdio::piped()).status().map_err(|e| e.to_string())?;
            if !status.success() { update(&install_id, |p| { p.status=InstallationStatus::Failed; p.progress=0; p.message="Installation failed".into(); p.error=Some(format!("npm exited with status {:?}", status.code())); p.completed_at=Some(now_iso()); }); return Err("npm install failed".into()); }

            update(&install_id, |p| { p.status=InstallationStatus::Configuring; p.progress=80; p.message="Configuring server...".into(); p.current_step=Some("Configuring".into()); p.current_step_number=Some(2); });
            update(&install_id, |p| { p.status=InstallationStatus::Completed; p.progress=100; p.message="Installation completed successfully".into(); p.current_step=Some("Completed".into()); p.current_step_number=Some(3); p.completed_at=Some(now_iso()); });
            Ok(())
        }
        InstallConfig::GitHub { repository, branch, tag, commit:_, sub_path:_ } => {
            update(&install_id, |p| { p.status=InstallationStatus::Downloading; p.progress=10; p.message=format!("Cloning {}...", repository); p.current_step=Some("Cloning".into()); p.total_steps=Some(4); p.current_step_number=Some(1); });
            let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            let target = dir.join("mcp_servers").join("github").join(repository.split('/').last().unwrap_or("repo"));
            std::fs::create_dir_all(&target).map_err(|e| e.to_string())?;

            let mut args = vec!["clone".to_string(), format!("https://github.com/{}.git", repository), target.to_string_lossy().to_string(), "--depth".into(), "1".into()];
            if let Some(b) = branch { args.push("--branch".into()); args.push(b); }
            if let Some(t) = tag { args.push("--branch".into()); args.push(t); }

            let status = Command::new("git").args(&args).stdout(Stdio::piped()).stderr(Stdio::piped()).status().map_err(|e| e.to_string())?;
            if !status.success() { update(&install_id, |p| { p.status=InstallationStatus::Failed; p.progress=0; p.message="Clone failed".into(); p.error=Some(format!("git exited with status {:?}", status.code())); p.completed_at=Some(now_iso()); }); return Err("git clone failed".into()); }

            update(&install_id, |p| { p.status=InstallationStatus::Installing; p.progress=60; p.message="Installing dependencies...".into(); p.current_step=Some("Installing deps".into()); p.current_step_number=Some(3); });
            // Best-effort npm install if package.json exists
            let pkg = target.join("package.json");
            if pkg.exists() { let _ = Command::new("npm").arg("install").current_dir(&target).status(); }

            update(&install_id, |p| { p.status=InstallationStatus::Completed; p.progress=100; p.message="Installation completed successfully".into(); p.current_step=Some("Completed".into()); p.current_step_number=Some(4); p.completed_at=Some(now_iso()); });
            Ok(())
        }
        InstallConfig::Local { path, .. } => {
            let pb = PathBuf::from(&path);
            if !pb.exists() || !pb.is_dir() { update(&install_id, |p| { p.status=InstallationStatus::Failed; p.progress=0; p.message="Invalid local path".into(); p.error=Some("Path must exist and be directory".into()); p.completed_at=Some(now_iso()); }); return Err("invalid path".into()); }
            update(&install_id, |p| { p.status=InstallationStatus::Configuring; p.progress=50; p.message="Configuring local server...".into(); p.current_step=Some("Configuring".into()); p.total_steps=Some(2); p.current_step_number=Some(1); });
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
