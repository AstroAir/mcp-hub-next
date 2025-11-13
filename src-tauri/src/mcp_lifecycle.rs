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
    if let Ok(state) = mcp_get_status(server_id.clone()) {
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

#[cfg(test)]
mod tests {
    use super::*;

    /// Test LifecycleState enum variants and equality
    #[test]
    fn test_lifecycle_state_variants() {
        assert_eq!(LifecycleState::Stopped, LifecycleState::Stopped);
        assert_ne!(LifecycleState::Running, LifecycleState::Stopped);

        let states = vec![
            LifecycleState::Stopped,
            LifecycleState::Starting,
            LifecycleState::Running,
            LifecycleState::Stopping,
            LifecycleState::Restarting,
            LifecycleState::Error,
        ];

        for state in &states {
            let json = serde_json::to_string(state).unwrap();
            let deserialized: LifecycleState = serde_json::from_str(&json).unwrap();
            assert_eq!(state, &deserialized);
        }
    }

    /// Test LifecycleState serialization format (lowercase)
    #[test]
    fn test_lifecycle_state_serde_format() {
        let json = serde_json::to_string(&LifecycleState::Running).unwrap();
        assert_eq!(json, "\"running\"");

        let json = serde_json::to_string(&LifecycleState::Stopped).unwrap();
        assert_eq!(json, "\"stopped\"");

        let json = serde_json::to_string(&LifecycleState::Error).unwrap();
        assert_eq!(json, "\"error\"");
    }

    /// Test MCPServerProcess structure serialization
    #[test]
    fn test_mcp_server_process_structure() {
        let process = MCPServerProcess {
            server_id: "test-server".to_string(),
            pid: Some(12345),
            state: LifecycleState::Running,
            started_at: Some("2025-01-01T00:00:00Z".to_string()),
            stopped_at: None,
            restart_count: 0,
            last_error: None,
            memory_usage: Some(1024000),
            cpu_usage: Some(5.5),
            uptime: Some(3600),
            output: Some("Server output".to_string()),
        };

        let json = serde_json::to_string(&process).unwrap();
        let deserialized: MCPServerProcess = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.server_id, "test-server");
        assert_eq!(deserialized.pid, Some(12345));
        assert_eq!(deserialized.state, LifecycleState::Running);
        assert_eq!(deserialized.uptime, Some(3600));
        assert_eq!(deserialized.memory_usage, Some(1024000));
        assert_eq!(deserialized.cpu_usage, Some(5.5));
    }

    /// Test MCPServerProcess with error state
    #[test]
    fn test_mcp_server_process_error_state() {
        let process = MCPServerProcess {
            server_id: "failed-server".to_string(),
            pid: Some(99999),
            state: LifecycleState::Error,
            started_at: Some("2025-01-01T00:00:00Z".to_string()),
            stopped_at: Some("2025-01-01T00:01:00Z".to_string()),
            restart_count: 3,
            last_error: Some("Process crashed".to_string()),
            memory_usage: None,
            cpu_usage: None,
            uptime: Some(60),
            output: None,
        };

        let json = serde_json::to_string(&process).unwrap();
        let deserialized: MCPServerProcess = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.state, LifecycleState::Error);
        assert_eq!(deserialized.restart_count, 3);
        assert_eq!(deserialized.last_error, Some("Process crashed".to_string()));
        assert!(deserialized.stopped_at.is_some());
    }

    /// Test StdioConfig with default values
    #[test]
    fn test_stdio_config_defaults() {
        let config_json = r#"{"command": "node"}"#;
        let config: StdioConfig = serde_json::from_str(config_json).unwrap();

        assert_eq!(config.command, "node");
        assert!(config.args.is_empty()); // #[serde(default)]
        assert!(config.env.is_empty()); // #[serde(default)]
        assert!(config.cwd.is_none());
    }

    /// Test StdioConfig with all fields
    #[test]
    fn test_stdio_config_complete() {
        let mut env = HashMap::new();
        env.insert("NODE_ENV".to_string(), "production".to_string());
        env.insert("PORT".to_string(), "3000".to_string());

        let config = StdioConfig {
            command: "node".to_string(),
            args: vec!["server.js".to_string(), "--verbose".to_string()],
            env: env.clone(),
            cwd: Some("/app".to_string()),
        };

        let json = serde_json::to_string(&config).unwrap();
        let deserialized: StdioConfig = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.command, "node");
        assert_eq!(deserialized.args.len(), 2);
        assert_eq!(deserialized.args[0], "server.js");
        assert_eq!(deserialized.args[1], "--verbose");
        assert_eq!(deserialized.env.len(), 2);
        assert_eq!(deserialized.env.get("NODE_ENV"), Some(&"production".to_string()));
        assert_eq!(deserialized.cwd, Some("/app".to_string()));
    }

    /// Test StdioConfig with empty arrays
    #[test]
    fn test_stdio_config_empty_collections() {
        let config = StdioConfig {
            command: "python".to_string(),
            args: vec![],
            env: HashMap::new(),
            cwd: None,
        };

        let json = serde_json::to_string(&config).unwrap();
        let deserialized: StdioConfig = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.command, "python");
        assert!(deserialized.args.is_empty());
        assert!(deserialized.env.is_empty());
        assert!(deserialized.cwd.is_none());
    }

    /// Test now_iso returns valid RFC3339 timestamp
    #[test]
    fn test_now_iso_format() {
        let timestamp = now_iso();

        // Should be parseable as RFC3339
        let parsed = chrono::DateTime::parse_from_rfc3339(&timestamp);
        assert!(parsed.is_ok(), "Timestamp should be valid RFC3339: {}", timestamp);

        // Should be recent (within last minute)
        let now = chrono::Utc::now();
        let diff = now.signed_duration_since(parsed.unwrap());
        assert!(diff.num_seconds() < 60, "Timestamp should be recent");
    }

    /// Test StdioConfig with complex environment variables
    #[test]
    fn test_stdio_config_complex_env() {
        let mut env = HashMap::new();
        env.insert("PATH".to_string(), "/usr/local/bin:/usr/bin".to_string());
        env.insert("API_KEY".to_string(), "secret-key-123".to_string());
        env.insert("DEBUG".to_string(), "true".to_string());

        let config = StdioConfig {
            command: "mcp-server".to_string(),
            args: vec!["--port".to_string(), "8080".to_string()],
            env,
            cwd: Some("/var/app".to_string()),
        };

        let json = serde_json::to_string(&config).unwrap();
        let deserialized: StdioConfig = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.env.get("API_KEY"), Some(&"secret-key-123".to_string()));
        assert_eq!(deserialized.env.get("DEBUG"), Some(&"true".to_string()));
    }

    /// Test MCPServerProcess with minimal fields
    #[test]
    fn test_mcp_server_process_minimal() {
        let process = MCPServerProcess {
            server_id: "minimal".to_string(),
            pid: None,
            state: LifecycleState::Stopped,
            started_at: None,
            stopped_at: None,
            restart_count: 0,
            last_error: None,
            memory_usage: None,
            cpu_usage: None,
            uptime: None,
            output: None,
        };

        let json = serde_json::to_string(&process).unwrap();
        let deserialized: MCPServerProcess = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.server_id, "minimal");
        assert_eq!(deserialized.pid, None);
        assert_eq!(deserialized.state, LifecycleState::Stopped);
        assert_eq!(deserialized.restart_count, 0);
    }

    /// Test state transitions validity
    #[test]
    fn test_state_transition_logic() {
        // Valid transitions
        let transitions = vec![
            (LifecycleState::Stopped, LifecycleState::Starting),
            (LifecycleState::Starting, LifecycleState::Running),
            (LifecycleState::Running, LifecycleState::Stopping),
            (LifecycleState::Stopping, LifecycleState::Stopped),
            (LifecycleState::Running, LifecycleState::Restarting),
            (LifecycleState::Restarting, LifecycleState::Starting),
            (LifecycleState::Running, LifecycleState::Error),
        ];

        for (from, to) in transitions {
            // Just verify the states are distinct and valid
            assert_ne!(from, to);
        }
    }
}
