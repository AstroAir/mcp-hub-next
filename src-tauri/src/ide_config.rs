use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

/// IDE/Client types that can manage MCP servers
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum ClientType {
    McpHub,
    ClaudeDesktop,
    Vscode,
    Cursor,
    Windsurf,
    Zed,
    Cline,
    Continue,
    Custom,
}

impl ClientType {
    pub fn as_str(&self) -> &str {
        match self {
            ClientType::McpHub => "mcp-hub",
            ClientType::ClaudeDesktop => "claude-desktop",
            ClientType::Vscode => "vscode",
            ClientType::Cursor => "cursor",
            ClientType::Windsurf => "windsurf",
            ClientType::Zed => "zed",
            ClientType::Cline => "cline",
            ClientType::Continue => "continue",
            ClientType::Custom => "custom",
        }
    }

    #[allow(dead_code)]
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "mcp-hub" => Some(ClientType::McpHub),
            "claude-desktop" => Some(ClientType::ClaudeDesktop),
            "vscode" => Some(ClientType::Vscode),
            "cursor" => Some(ClientType::Cursor),
            "windsurf" => Some(ClientType::Windsurf),
            "zed" => Some(ClientType::Zed),
            "cline" => Some(ClientType::Cline),
            "continue" => Some(ClientType::Continue),
            "custom" => Some(ClientType::Custom),
            _ => None,
        }
    }
}

/// Generic IDE server configuration structure
/// Supports both stdio (command-based) and remote (URL-based) servers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IDEServerConfig {
    #[serde(default)]
    pub command: Option<String>,
    #[serde(default)]
    pub args: Vec<String>,
    #[serde(default)]
    pub env: HashMap<String, String>,
    pub cwd: Option<String>,
    // Remote server fields
    pub url: Option<String>,
    #[serde(default)]
    pub headers: HashMap<String, String>,
    pub transport: Option<String>,
}

/// IDE configuration format (Claude Desktop, VSCode, etc.)
/// This is a flexible structure that can parse multiple formats
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IDEConfig {
    #[serde(rename = "mcpServers", default)]
    pub mcp_servers: HashMap<String, IDEServerConfig>,
}

/// Config discovery result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigDiscovery {
    pub client_type: String,
    pub config_path: String,
    pub found: bool,
    pub readable: bool,
    pub server_count: Option<usize>,
    pub servers: Option<Vec<String>>,
}

/// Config validation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigValidation {
    pub valid: bool,
    pub client_type: Option<String>,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub server_count: Option<usize>,
}

/// Get the default config path for a given client type
pub fn get_default_config_path(client_type: &ClientType) -> Result<PathBuf, String> {
    match client_type {
        ClientType::ClaudeDesktop => {
            #[cfg(target_os = "macos")]
            {
                let home_dir = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
                Ok(home_dir
                    .join("Library")
                    .join("Application Support")
                    .join("Claude")
                    .join("claude_desktop_config.json"))
            }
            #[cfg(target_os = "windows")]
            {
                let appdata = std::env::var("APPDATA")
                    .map_err(|_| "Could not find APPDATA directory".to_string())?;
                Ok(PathBuf::from(appdata)
                    .join("Claude")
                    .join("claude_desktop_config.json"))
            }
            #[cfg(target_os = "linux")]
            {
                let home_dir = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
                Ok(home_dir
                    .join(".config")
                    .join("Claude")
                    .join("claude_desktop_config.json"))
            }
        }
        ClientType::Vscode | ClientType::Cline | ClientType::Continue => {
            // VSCode settings can be in multiple locations, return user settings
            #[cfg(target_os = "macos")]
            {
                let home_dir = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
                Ok(home_dir
                    .join("Library")
                    .join("Application Support")
                    .join("Code")
                    .join("User")
                    .join("settings.json"))
            }
            #[cfg(target_os = "windows")]
            {
                let appdata = std::env::var("APPDATA")
                    .map_err(|_| "Could not find APPDATA directory".to_string())?;
                Ok(PathBuf::from(appdata)
                    .join("Code")
                    .join("User")
                    .join("settings.json"))
            }
            #[cfg(target_os = "linux")]
            {
                let home_dir = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
                Ok(home_dir.join(".config").join("Code").join("User").join("settings.json"))
            }
        }
        ClientType::Cursor => {
            // Cursor uses similar paths to VS Code but with "Cursor" instead of "Code"
            #[cfg(target_os = "macos")]
            {
                let home_dir = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
                Ok(home_dir
                    .join("Library")
                    .join("Application Support")
                    .join("Cursor")
                    .join("User")
                    .join("settings.json"))
            }
            #[cfg(target_os = "windows")]
            {
                let appdata = std::env::var("APPDATA")
                    .map_err(|_| "Could not find APPDATA directory".to_string())?;
                Ok(PathBuf::from(appdata)
                    .join("Cursor")
                    .join("User")
                    .join("settings.json"))
            }
            #[cfg(target_os = "linux")]
            {
                let home_dir = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
                Ok(home_dir.join(".config").join("Cursor").join("User").join("settings.json"))
            }
        }
        ClientType::Windsurf => {
            // Windsurf config paths
            #[cfg(target_os = "macos")]
            {
                let home_dir = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
                Ok(home_dir
                    .join("Library")
                    .join("Application Support")
                    .join("Windsurf")
                    .join("User")
                    .join("settings.json"))
            }
            #[cfg(target_os = "windows")]
            {
                let appdata = std::env::var("APPDATA")
                    .map_err(|_| "Could not find APPDATA directory".to_string())?;
                Ok(PathBuf::from(appdata)
                    .join("Windsurf")
                    .join("User")
                    .join("settings.json"))
            }
            #[cfg(target_os = "linux")]
            {
                let home_dir = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
                Ok(home_dir.join(".config").join("Windsurf").join("User").join("settings.json"))
            }
        }
        ClientType::Zed => {
            // Zed config paths
            #[cfg(target_os = "macos")]
            {
                let home_dir = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
                Ok(home_dir
                    .join(".config")
                    .join("zed")
                    .join("settings.json"))
            }
            #[cfg(target_os = "windows")]
            {
                let appdata = std::env::var("APPDATA")
                    .map_err(|_| "Could not find APPDATA directory".to_string())?;
                Ok(PathBuf::from(appdata)
                    .join("Zed")
                    .join("settings.json"))
            }
            #[cfg(target_os = "linux")]
            {
                let home_dir = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
                Ok(home_dir.join(".config").join("zed").join("settings.json"))
            }
        }
        _ => Err(format!("No default config path for client type: {:?}", client_type)),
    }
}

/// Discover IDE config files on the system
#[tauri::command]
pub fn discover_ide_configs() -> Result<Vec<ConfigDiscovery>, String> {
    let client_types = vec![
        ClientType::ClaudeDesktop,
        ClientType::Vscode,
        ClientType::Cursor,
        ClientType::Windsurf,
        ClientType::Zed,
        ClientType::Cline,
        ClientType::Continue,
    ];

    let mut discoveries = Vec::new();

    for client_type in client_types {
        let discovery = match get_default_config_path(&client_type) {
            Ok(path) => {
                let path_str = path.to_string_lossy().to_string();
                let found = path.exists();
                let readable = found && path.is_file();

                let (server_count, servers) = if readable {
                    match parse_ide_config(&path_str) {
                        Ok(config) => {
                            let count = config.mcp_servers.len();
                            let server_names: Vec<String> =
                                config.mcp_servers.keys().cloned().collect();
                            (Some(count), Some(server_names))
                        }
                        Err(_) => (None, None),
                    }
                } else {
                    (None, None)
                };

                ConfigDiscovery {
                    client_type: client_type.as_str().to_string(),
                    config_path: path_str,
                    found,
                    readable,
                    server_count,
                    servers,
                }
            }
            Err(_) => ConfigDiscovery {
                client_type: client_type.as_str().to_string(),
                config_path: String::new(),
                found: false,
                readable: false,
                server_count: None,
                servers: None,
            },
        };

        discoveries.push(discovery);
    }

    Ok(discoveries)
}

/// Parse an IDE config file with support for multiple formats
/// Tries multiple config key formats: mcpServers, mcp.servers, cursor.mcp.servers
fn parse_ide_config(path: &str) -> Result<IDEConfig, String> {
    let content = fs::read_to_string(path)
        .map_err(|e| format!("Failed to read config file: {}", e))?;

    // Parse as generic JSON first
    let json: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse config JSON: {}", e))?;

    // Try different config key formats
    let servers_map = if let Some(servers) = json.get("mcpServers") {
        // Claude Desktop format
        servers.as_object()
            .ok_or_else(|| "mcpServers is not an object".to_string())?
    } else if let Some(servers) = json.get("mcp.servers") {
        // VS Code format
        servers.as_object()
            .ok_or_else(|| "mcp.servers is not an object".to_string())?
    } else if let Some(servers) = json.get("cursor.mcp.servers") {
        // Cursor format
        servers.as_object()
            .ok_or_else(|| "cursor.mcp.servers is not an object".to_string())?
    } else {
        return Err("No MCP servers configuration found. Expected 'mcpServers', 'mcp.servers', or 'cursor.mcp.servers' key.".to_string());
    };

    // Parse each server config
    let mut mcp_servers = HashMap::new();
    for (name, server_value) in servers_map {
        let server_config: IDEServerConfig = serde_json::from_value(server_value.clone())
            .map_err(|e| format!("Failed to parse server '{}': {}", name, e))?;
        mcp_servers.insert(name.clone(), server_config);
    }

    Ok(IDEConfig { mcp_servers })
}

/// Validate an IDE config file
#[tauri::command]
pub fn validate_ide_config(path: String, client_type: Option<String>) -> Result<ConfigValidation, String> {
    let mut validation = ConfigValidation {
        valid: true,
        client_type: client_type.clone(),
        errors: Vec::new(),
        warnings: Vec::new(),
        server_count: None,
    };

    // Check if file exists
    let path_buf = PathBuf::from(&path);
    if !path_buf.exists() {
        validation.valid = false;
        validation.errors.push(format!("Config file not found: {}", path));
        return Ok(validation);
    }

    // Try to parse the config
    match parse_ide_config(&path) {
        Ok(config) => {
            validation.server_count = Some(config.mcp_servers.len());

            // Validate each server config
            for (name, server_config) in &config.mcp_servers {
                // Check if server has either command or url
                let has_command = server_config.command.as_ref().map_or(false, |c| !c.is_empty());
                let has_url = server_config.url.as_ref().map_or(false, |u| !u.is_empty());

                if !has_command && !has_url {
                    validation.warnings.push(format!(
                        "Server '{}' has neither command nor url",
                        name
                    ));
                }

                // Check if command is executable (basic check)
                if let Some(command) = &server_config.command {
                    if !command.contains('/') && !command.contains('\\') {
                        // Looks like a command name, should be in PATH
                        validation.warnings.push(format!(
                            "Server '{}' command '{}' should be in PATH or use absolute path",
                            name, command
                        ));
                    }
                }
            }

            if config.mcp_servers.is_empty() {
                validation.warnings.push("No servers defined in config".to_string());
            }
        }
        Err(e) => {
            validation.valid = false;
            validation.errors.push(format!("Failed to parse config: {}", e));
        }
    }

    Ok(validation)
}

/// Import IDE config and convert to MCP Hub format
#[tauri::command]
pub fn import_ide_config(
    path: String,
    client_type: String,
    merge_strategy: Option<String>,
) -> Result<String, String> {
    // Parse the IDE config
    let ide_config = parse_ide_config(&path)?;

    let _merge_strat = merge_strategy.unwrap_or_else(|| "merge".to_string());

    // Convert to MCP Hub server configs
    let mut mcp_servers = Vec::new();

    for (server_name, server_config) in ide_config.mcp_servers {
        let server_id = nanoid::nanoid!();
        let now = chrono::Utc::now().to_rfc3339();

        // Determine transport type based on config
        let server_json = if let Some(url) = &server_config.url {
            // Remote server (SSE or HTTP)
            let transport = server_config.transport.as_deref().unwrap_or("sse");
            let transport_type = if transport == "http" { "http" } else { "sse" };

            serde_json::json!({
                "id": server_id,
                "name": server_name,
                "transportType": transport_type,
                "url": url,
                "headers": server_config.headers,
                "enabled": true,
                "createdAt": now,
                "updatedAt": now,
                "clientType": client_type,
                "configSourcePath": path,
                "originalConfig": serde_json::to_string(&server_config)
                    .unwrap_or_default(),
            })
        } else if let Some(command) = &server_config.command {
            // stdio server
            serde_json::json!({
                "id": server_id,
                "name": server_name,
                "transportType": "stdio",
                "command": command,
                "args": server_config.args,
                "env": server_config.env,
                "cwd": server_config.cwd,
                "enabled": true,
                "createdAt": now,
                "updatedAt": now,
                "clientType": client_type,
                "configSourcePath": path,
                "originalConfig": serde_json::to_string(&server_config)
                    .unwrap_or_default(),
            })
        } else {
            // Invalid config - skip this server
            log::warn!("Server '{}' has neither command nor url, skipping", server_name);
            continue;
        };

        mcp_servers.push(server_json);
    }

    // Return as JSON array
    serde_json::to_string(&mcp_servers)
        .map_err(|e| format!("Failed to serialize servers: {}", e))
}

/// Export MCP Hub servers to IDE config format
#[tauri::command]
pub fn export_to_ide_format(
    servers_json: String,
    _client_type: String,
    output_path: Option<String>,
) -> Result<String, String> {
    // Parse servers JSON
    let servers: Vec<serde_json::Value> = serde_json::from_str(&servers_json)
        .map_err(|e| format!("Failed to parse servers JSON: {}", e))?;

    // Convert to IDE format
    let mut mcp_servers = HashMap::new();

    for server in servers {
        let name = server["name"]
            .as_str()
            .ok_or_else(|| "Server missing name field".to_string())?;

        let transport_type = server["transportType"].as_str().unwrap_or("stdio");

        let ide_server_config = if transport_type == "stdio" {
            // stdio server
            let command = server["command"]
                .as_str()
                .ok_or_else(|| format!("Server '{}' missing command field", name))?;

            let args: Vec<String> = server["args"]
                .as_array()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default();

            let env: HashMap<String, String> = server["env"]
                .as_object()
                .map(|obj| {
                    obj.iter()
                        .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                        .collect()
                })
                .unwrap_or_default();

            let cwd = server["cwd"].as_str().map(String::from);

            IDEServerConfig {
                command: Some(command.to_string()),
                args,
                env,
                cwd,
                url: None,
                headers: HashMap::new(),
                transport: None,
            }
        } else {
            // Remote server (SSE or HTTP)
            let url = server["url"]
                .as_str()
                .ok_or_else(|| format!("Server '{}' missing url field", name))?;

            let headers: HashMap<String, String> = server["headers"]
                .as_object()
                .map(|obj| {
                    obj.iter()
                        .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                        .collect()
                })
                .unwrap_or_default();

            IDEServerConfig {
                command: None,
                args: Vec::new(),
                env: HashMap::new(),
                cwd: None,
                url: Some(url.to_string()),
                headers,
                transport: Some(transport_type.to_string()),
            }
        };

        mcp_servers.insert(name.to_string(), ide_server_config);
    }

    let ide_config = IDEConfig { mcp_servers };

    // Serialize to JSON (pretty format)
    let json_output = serde_json::to_string_pretty(&ide_config)
        .map_err(|e| format!("Failed to serialize IDE config: {}", e))?;

    // Write to file if output path provided
    if let Some(path) = output_path {
        fs::write(&path, &json_output)
            .map_err(|e| format!("Failed to write config file: {}", e))?;
        log::info!("Exported IDE config to: {}", path);
    }

    Ok(json_output)
}

/// Cross-platform path validation and normalization
pub fn validate_and_normalize_path(path: &str) -> Result<String, String> {
    let path_buf = PathBuf::from(path);

    // Try to canonicalize (resolves symlinks, relative paths, etc.)
    match path_buf.canonicalize() {
        Ok(canonical) => Ok(canonical.to_string_lossy().to_string()),
        Err(e) => {
            // If canonicalize fails, check if path at least exists
            if path_buf.exists() {
                // Path exists but can't be canonicalized (maybe permissions issue)
                Ok(path.to_string())
            } else {
                Err(format!("Path does not exist or is not accessible: {}", e))
            }
        }
    }
}

/// Validate path for use in server configuration
#[tauri::command]
pub fn validate_config_path(path: String, must_exist: Option<bool>) -> Result<String, String> {
    let should_exist = must_exist.unwrap_or(true);

    if should_exist {
        validate_and_normalize_path(&path)
    } else {
        // Just check if path is well-formed
        let path_buf = PathBuf::from(&path);
        if path_buf.as_os_str().is_empty() {
            Err("Path is empty".to_string())
        } else {
            Ok(path)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_client_type_serialization() {
        let client = ClientType::ClaudeDesktop;
        assert_eq!(client.as_str(), "claude-desktop");

        let parsed = ClientType::from_str("vscode");
        assert_eq!(parsed, Some(ClientType::Vscode));
    }

    #[test]
    fn test_ide_config_parsing() {
        let config_json = r#"{
            "mcpServers": {
                "filesystem": {
                    "command": "npx",
                    "args": ["@modelcontextprotocol/server-filesystem", "/tmp"],
                    "env": {}
                }
            }
        }"#;

        let config: Result<IDEConfig, _> = serde_json::from_str(config_json);
        assert!(config.is_ok());

        let config = config.unwrap();
        assert_eq!(config.mcp_servers.len(), 1);
        assert!(config.mcp_servers.contains_key("filesystem"));
    }

    #[test]
    fn test_validate_config_path() {
        // Test with existing path (current directory)
        let result = validate_config_path(".".to_string(), Some(true));
        assert!(result.is_ok());

        // Test with non-existing path
        let result = validate_config_path("/nonexistent/path/test".to_string(), Some(true));
        assert!(result.is_err());

        // Test without existence check
        let result = validate_config_path("/any/path".to_string(), Some(false));
        assert!(result.is_ok());
    }

    #[test]
    fn test_config_validation() {
        use std::io::Write;
        use tempfile::NamedTempFile;

        // Create a temporary config file
        let mut temp_file = NamedTempFile::new().unwrap();
        let config_content = r#"{
            "mcpServers": {
                "test": {
                    "command": "node",
                    "args": ["server.js"]
                }
            }
        }"#;
        temp_file.write_all(config_content.as_bytes()).unwrap();
        temp_file.flush().unwrap();

        let path = temp_file.path().to_string_lossy().to_string();
        let result = validate_ide_config(path, Some("claude-desktop".to_string()));

        assert!(result.is_ok());
        let validation = result.unwrap();
        assert!(validation.valid);
        assert_eq!(validation.server_count, Some(1));
    }
}
