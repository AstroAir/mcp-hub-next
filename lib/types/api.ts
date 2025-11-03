/**
 * API Request and Response Types
 */

import type {
  MCPServerConfig,
  MCPServerTestResult,
  MCPConnectionState,
  MCPToolCallResult,
  InstallConfig,
  InstallationProgress,
  InstalledServerMetadata,
  InstallationValidation,
  MCPServerProcess,
  RegistryServerEntry,
  RegistrySearchFilters
} from './mcp';
import type { ChatMessage, ClaudeModel } from './chat';

/**
 * Generic API response wrapper
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Server CRUD API
 */
export interface CreateServerRequest {
  config: Omit<MCPServerConfig, 'id' | 'createdAt' | 'updatedAt'>;
}

export type CreateServerResponse = APIResponse<MCPServerConfig>;

export interface UpdateServerRequest {
  config: Partial<MCPServerConfig>;
}

export type UpdateServerResponse = APIResponse<MCPServerConfig>;

export type DeleteServerResponse = APIResponse<{ id: string }>;

export type ListServersResponse = APIResponse<MCPServerConfig[]>;

export type GetServerResponse = APIResponse<MCPServerConfig>;

/**
 * Connection API
 */
export interface ConnectServerRequest {
  serverId: string;
}

export type ConnectServerResponse = APIResponse<MCPConnectionState>;

export interface DisconnectServerRequest {
  serverId: string;
}

export type DisconnectServerResponse = APIResponse<{ serverId: string }>;

export interface TestServerRequest {
  config: MCPServerConfig;
}

export type TestServerResponse = APIResponse<MCPServerTestResult>;

/**
 * Tool execution API
 */
export interface ExecuteToolRequest {
  serverId: string;
  toolName: string;
  input: Record<string, unknown>;
}

export type ExecuteToolResponse = APIResponse<MCPToolCallResult>;

/**
 * Chat API
 */
export interface ChatRequest {
  messages: ChatMessage[];
  model: ClaudeModel;
  connectedServers: string[]; // Server IDs to use for tool calls
  stream?: boolean;
}

export type ChatResponse = APIResponse<{
  message: ChatMessage;
  toolCalls?: MCPToolCallResult[];
}>;

/**
 * Installation API
 */
export interface InstallServerRequest {
  config: InstallConfig;
  serverName: string;
  serverDescription?: string;
  autoStart?: boolean; // Automatically start server after installation
}

export type InstallServerResponse = APIResponse<{
  installId: string;
  progress: InstallationProgress;
}>;

export interface GetInstallProgressRequest {
  installId: string;
}

export type GetInstallProgressResponse = APIResponse<InstallationProgress>;

export interface CancelInstallRequest {
  installId: string;
}

export type CancelInstallResponse = APIResponse<{ installId: string }>;

export interface ValidateInstallRequest {
  config: InstallConfig;
}

export type ValidateInstallResponse = APIResponse<InstallationValidation>;

export type ListInstalledServersResponse = APIResponse<InstalledServerMetadata[]>;

export interface UninstallServerRequest {
  serverId: string;
  removeData?: boolean; // Remove server data and configuration
}

export type UninstallServerResponse = APIResponse<{ serverId: string }>;

/**
 * Lifecycle Management API
 */
export interface StartServerRequest {
  serverId: string;
  config?: Partial<MCPServerConfig>; // Optional config overrides
}

export type StartServerResponse = APIResponse<MCPServerProcess>;

export interface StopServerRequest {
  serverId: string;
  force?: boolean; // Force stop if graceful shutdown fails
}

export type StopServerResponse = APIResponse<{ serverId: string }>;

export interface RestartServerRequest {
  serverId: string;
  config?: Partial<MCPServerConfig>; // Optional config overrides
}

export type RestartServerResponse = APIResponse<MCPServerProcess>;

export interface GetServerStatusRequest {
  serverId: string;
}

export type GetServerStatusResponse = APIResponse<MCPServerProcess>;

export type ListRunningServersResponse = APIResponse<MCPServerProcess[]>;

/**
 * Registry API
 */
export interface SearchRegistryRequest {
  filters: RegistrySearchFilters;
}

export type SearchRegistryResponse = APIResponse<{
  servers: RegistryServerEntry[];
  total: number;
  hasMore: boolean;
}>;

export interface GetRegistryServerRequest {
  serverId: string;
}

export type GetRegistryServerResponse = APIResponse<RegistryServerEntry>;

export type ListRegistryCategoriesResponse = APIResponse<string[]>;

export interface GetPopularServersRequest {
  limit?: number;
  source?: 'npm' | 'github';
}

export type GetPopularServersResponse = APIResponse<RegistryServerEntry[]>;

