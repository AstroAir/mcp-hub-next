/**
 * MCP Server Configuration Types
 * Defines types for all three MCP transport mechanisms: stdio, SSE, and HTTP
 */

export type MCPTransportType = 'stdio' | 'sse' | 'http';

export type ConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'error' 
  | 'reconnecting';

/**
 * Base configuration shared by all server types
 */
export interface BaseMCPServerConfig {
  id: string;
  name: string;
  description?: string;
  transportType: MCPTransportType;
  createdAt: string;
  updatedAt: string;
}

/**
 * stdio transport configuration
 * Server runs as a subprocess, communicates via stdin/stdout
 */
export interface StdioMCPServerConfig extends BaseMCPServerConfig {
  transportType: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

/**
 * SSE (Server-Sent Events) transport configuration
 * Server runs independently, client connects via SSE
 */
export interface SSEMCPServerConfig extends BaseMCPServerConfig {
  transportType: 'sse';
  url: string;
  headers?: Record<string, string>;
  sseEndpoint?: string; // Optional separate SSE endpoint
  postEndpoint?: string; // Optional separate POST endpoint
}

/**
 * HTTP transport configuration
 * Server runs independently, client connects via HTTP
 */
export interface HTTPMCPServerConfig extends BaseMCPServerConfig {
  transportType: 'http';
  url: string;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST';
  timeout?: number; // Request timeout in milliseconds (default: 30000)
}

/**
 * Union type for all server configurations
 */
export type MCPServerConfig = 
  | StdioMCPServerConfig 
  | SSEMCPServerConfig 
  | HTTPMCPServerConfig;

/**
 * Connection state for an active MCP server
 */
export interface MCPConnectionState {
  serverId: string;
  status: ConnectionStatus;
  connectedAt?: string;
  lastError?: string;
  errorCount: number;
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
}

/**
 * MCP Tool definition
 */
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * MCP Resource definition
 */
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/**
 * MCP Prompt definition
 */
export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

/**
 * Tool call result
 */
export interface MCPToolCallResult {
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  error?: string;
  timestamp: string;
}

/**
 * Server test result
 */
export interface MCPServerTestResult {
  success: boolean;
  message: string;
  tools?: MCPTool[];
  resources?: MCPResource[];
  prompts?: MCPPrompt[];
  error?: string;
  latency?: number;
}

/**
 * Connection history entry
 */
export interface MCPConnectionHistoryEntry {
  id?: string; // Optional ID for tracking
  serverId: string;
  serverName: string;
  timestamp: string; // When the connection attempt was made
  success: boolean; // Whether the connection was successful
  error?: string; // Error message if connection failed
  duration?: number; // Connection duration in milliseconds
}

/**
 * Installation source types
 */
export type InstallationSource = 'npm' | 'github' | 'local';

/**
 * Installation status
 */
export type InstallationStatus =
  | 'pending'
  | 'downloading'
  | 'installing'
  | 'configuring'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Lifecycle state for MCP server processes
 */
export type LifecycleState =
  | 'stopped'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'restarting'
  | 'error';

/**
 * npm package installation configuration
 */
export interface NPMInstallConfig {
  source: 'npm';
  packageName: string;
  version?: string; // Optional version, defaults to latest
  global?: boolean; // Install globally or locally
  registry?: string; // Custom npm registry URL
}

/**
 * GitHub repository installation configuration
 */
export interface GitHubInstallConfig {
  source: 'github';
  repository: string; // Format: owner/repo
  branch?: string; // Optional branch, defaults to main/master
  tag?: string; // Optional tag
  commit?: string; // Optional specific commit
  subPath?: string; // Optional subdirectory path
}

/**
 * Local path installation configuration
 */
export interface LocalInstallConfig {
  source: 'local';
  path: string; // Absolute or relative path
  validate?: boolean; // Validate path exists and is accessible
}

/**
 * Union type for all installation configurations
 */
export type InstallConfig =
  | NPMInstallConfig
  | GitHubInstallConfig
  | LocalInstallConfig;

/**
 * Installation progress information
 */
export interface InstallationProgress {
  installId: string;
  status: InstallationStatus;
  progress: number; // 0-100
  message: string;
  currentStep?: string;
  totalSteps?: number;
  currentStepNumber?: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  logs?: string[];
}

/**
 * Installed MCP server metadata
 */
export interface InstalledServerMetadata {
  serverId: string;
  installId: string;
  source: InstallationSource;
  installConfig: InstallConfig;
  installedAt: string;
  installedPath: string;
  version?: string;
  dependencies?: string[];
}

/**
 * MCP server process information
 */
export interface MCPServerProcess {
  serverId: string;
  pid?: number;
  state: LifecycleState;
  startedAt?: string;
  stoppedAt?: string;
  restartCount: number;
  lastError?: string;
  memoryUsage?: number; // In bytes
  cpuUsage?: number; // Percentage
  uptime?: number; // In seconds
}

/**
 * Registry server entry
 */
export interface RegistryServerEntry {
  id: string;
  name: string;
  description: string;
  source: InstallationSource;
  packageName?: string; // For npm packages
  repository?: string; // For GitHub repos
  version?: string;
  author?: string;
  homepage?: string;
  documentation?: string;
  tags?: string[];
  downloads?: number;
  stars?: number;
  lastUpdated?: string;
  verified?: boolean;
}

/**
 * Registry search filters
 */
export interface RegistrySearchFilters {
  query?: string;
  source?: InstallationSource;
  tags?: string[];
  verified?: boolean;
  sortBy?: 'relevance' | 'downloads' | 'stars' | 'updated';
  limit?: number;
  offset?: number;
}

/**
 * Dependency information
 */
export interface DependencyInfo {
  name: string;
  version?: string;
  required: boolean;
  installed: boolean;
  installPath?: string;
}

/**
 * Installation validation result
 */
export interface InstallationValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  dependencies: DependencyInfo[];
  estimatedSize?: number; // In bytes
  estimatedTime?: number; // In seconds
}

