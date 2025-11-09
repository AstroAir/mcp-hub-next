use serde::{Deserialize, Serialize};
use std::{collections::HashMap, process::{Child, Command, Stdio}, sync::{Mutex, OnceLock}, time::{Duration, SystemTime}};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum LifecycleState {
    Stopped,
    Starting,
    Running,
    Stopping,
    Restarting,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPServerProcess {
    pub server_id: String,
    pub pid: Option<u32>,
    pub state: LifecycleState,
    pub started_at: Option<String>,
    pub stopped_at: Option<String>,
    pub restart_count: u32,
    pub last_error: Option<String>,
    pub memory_usage: Option<u64>,
    pub cpu_usage: Option<f32>,
    pub uptime: Option<u64>,
    pub output: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StdioConfig {
    pub command: String,
    #[serde(default)]
    pub args: Vec<String>,
    #[serde(default)]
    pub env: HashMap<String, String>,
    pub cwd: Option<String>,
}

#[derive(Debug)]
struct ProcEntry {
    child: Child,
    state: MCPServerProcess,
    started: SystemTime,
}

static PROCESSES: OnceLock<Mutex<HashMap<String, ProcEntry>>> = OnceLock::new();

fn processes() -> &'static Mutex<HashMap<String, ProcEntry>> {
    PROCESSES.get_or_init(|| Mutex::new(HashMap::new()))
}

fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339()
}

fn update_uptime(entry: &mut ProcEntry) {
    if let Ok(elapsed) = entry.started.elapsed() {
        entry.state.uptime = Some(elapsed.as_secs());
    }
}

#[tauri::command]
pub fn mcp_start_server(server_id: String, cfg: StdioConfig) -> Result<MCPServerProcess, String> {
    // If already running, return current state
    if let Some(state) = mcp_get_status(server_id.clone()).ok() {
        if state.state == LifecycleState::Running {
            return Ok(state);
        }
    }

    // Spawn process
    let mut cmd = Command::new(&cfg.command);
    if !cfg.args.is_empty() {
        cmd.args(&cfg.args);
    }
    if let Some(cwd) = &cfg.cwd {
        cmd.current_dir(cwd);
    }
    if !cfg.env.is_empty() {
        cmd.envs(&cfg.env);
    }
    cmd.stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped());

    let child = cmd.spawn().map_err(|e| format!("Failed to start process: {e}"))?;
    let pid_val = child.id();

    let process = MCPServerProcess {
        server_id: server_id.clone(),
    pid: Some(pid_val),
        state: LifecycleState::Running,
        started_at: Some(now_iso()),
        stopped_at: None,
        restart_count: 0,
        last_error: None,
        memory_usage: None,
        cpu_usage: None,
        uptime: Some(0),
        output: None,
    };

    let entry = ProcEntry { child, state: process.clone(), started: SystemTime::now() };
    processes().lock().map_err(|_| "Lock poisoned")?.insert(server_id, entry);

    Ok(process)
}

#[tauri::command]
pub fn mcp_stop_server(server_id: String, force: Option<bool>) -> Result<(), String> {
    let mut map = processes().lock().map_err(|_| "Lock poisoned")?;
    let force = force.unwrap_or(false);
    let mut entry = map.remove(&server_id).ok_or_else(|| format!("No running process for {server_id}"))?;

    entry.state.state = LifecycleState::Stopping;
    if force {
        entry.child.kill().map_err(|e| format!("Failed to kill process: {e}"))?;
    } else {
        // Try to terminate gracefully; on Windows, there's no SIGTERM, so kill
        #[cfg(unix)]
        {
            use nix::sys::signal::{kill, Signal};
            use nix::unistd::Pid;
            if let Some(pid) = entry.child.id() { let _ = kill(Pid::from_raw(pid as i32), Signal::SIGTERM); }
        }
        #[cfg(not(unix))]
        {
            let _ = entry.child.kill();
        }

        // Wait briefly
        let _ = entry.child.wait();
    }

    entry.state.state = LifecycleState::Stopped;
    entry.state.stopped_at = Some(now_iso());
    Ok(())
}

#[tauri::command]
pub fn mcp_restart_server(server_id: String, cfg: Option<StdioConfig>) -> Result<MCPServerProcess, String> {
    // Stop if exists (ignore errors)
    let _ = mcp_stop_server(server_id.clone(), Some(false));
    // Wait a moment
    std::thread::sleep(Duration::from_millis(300));
    // Start again
    match cfg {
        Some(c) => mcp_start_server(server_id, c),
        None => Err("Missing configuration for restart".into()),
    }
}

#[tauri::command]
pub fn mcp_get_status(server_id: String) -> Result<MCPServerProcess, String> {
    let mut map = processes().lock().map_err(|_| "Lock poisoned")?;
    let entry = map.get_mut(&server_id).ok_or_else(|| format!("No process for {server_id}"))?;
    // Refresh uptime; basic health check
    if let Some(status) = entry.child.try_wait().map_err(|e| format!("Failed to poll process: {e}"))? {
        if let Some(code) = status.code() {
            entry.state.state = if code == 0 { LifecycleState::Stopped } else { LifecycleState::Error };
            entry.state.stopped_at = Some(now_iso());
            entry.state.last_error = if code == 0 { None } else { Some(format!("Exited with code {code}")) };
        }
    } else {
        entry.state.state = LifecycleState::Running;
        update_uptime(entry);
    }
    Ok(entry.state.clone())
}

#[tauri::command]
pub fn mcp_list_running() -> Result<Vec<MCPServerProcess>, String> {
    let mut results = Vec::new();
    let mut map = processes().lock().map_err(|_| "Lock poisoned")?;
    for entry in map.values_mut() {
        update_uptime(entry);
        results.push(entry.state.clone());
    }
    Ok(results)
}
