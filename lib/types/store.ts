/**
 * Zustand Store Types
 */

import type {
  MCPServerConfig,
  MCPConnectionState,
  MCPConnectionHistoryEntry,
  InstallationProgress,
  InstalledServerMetadata,
  MCPServerProcess,
  RegistryServerEntry
} from './mcp';
import type { ChatSession, ChatMessage, ClaudeModel } from './chat';

/**
 * Server Store State
 */
export interface ServerStoreState {
  // Server configurations
  servers: MCPServerConfig[];

  // Installation state
  installations: Record<string, InstallationProgress>;
  installedServers: Record<string, InstalledServerMetadata>;

  // Actions
  addServer: (server: MCPServerConfig) => void;
  updateServer: (id: string, updates: Partial<MCPServerConfig>) => void;
  removeServer: (id: string) => void;
  getServer: (id: string) => MCPServerConfig | undefined;

  // Installation actions
  setInstallationProgress: (installId: string, progress: InstallationProgress) => void;
  removeInstallation: (installId: string) => void;
  getInstallation: (installId: string) => InstallationProgress | undefined;
  addInstalledServer: (metadata: InstalledServerMetadata) => void;
  removeInstalledServer: (serverId: string) => void;
  getInstalledServer: (serverId: string) => InstalledServerMetadata | undefined;

  // Persistence
  loadServers: () => void;
  saveServers: () => void;
  loadInstallations: () => void;
  saveInstallations: () => void;
}

/**
 * Connection Store State
 */
export interface ConnectionStoreState {
  // Active connections
  connections: Record<string, MCPConnectionState>;
  
  // Connection history
  history: MCPConnectionHistoryEntry[];
  
  // Actions
  setConnectionState: (serverId: string, state: MCPConnectionState) => void;
  removeConnection: (serverId: string) => void;
  getConnection: (serverId: string) => MCPConnectionState | undefined;
  addHistoryEntry: (entry: MCPConnectionHistoryEntry) => void;
  clearHistory: () => void;
  
  // Persistence
  loadHistory: () => void;
  saveHistory: () => void;
}

/**
 * UI Store State
 */
export interface UIStoreState {
  // Modal states
  isServerFormOpen: boolean;
  isServerDetailOpen: boolean;
  selectedServerId: string | null;
  
  // Loading states
  isLoading: Record<string, boolean>;
  
  // Error states
  errors: Record<string, string>;
  
  // Actions
  openServerForm: () => void;
  closeServerForm: () => void;
  openServerDetail: (serverId: string) => void;
  closeServerDetail: () => void;
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
}

/**
 * Chat Store State
 */
export interface ChatStoreState {
  // Chat sessions
  sessions: ChatSession[];
  currentSessionId: string | null;
  
  // Current chat state
  messages: ChatMessage[];
  model: ClaudeModel;
  connectedServers: string[];
  isStreaming: boolean;
  
  // Actions
  createSession: (title?: string) => string;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, newTitle: string) => void;
  setCurrentSession: (sessionId: string) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  setModel: (model: ClaudeModel) => void;
  toggleServer: (serverId: string) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;

  // Persistence
  loadSessions: () => void;
  saveSessions: () => void;
}

/**
 * Lifecycle Store State
 */
export interface LifecycleStoreState {
  // Running processes
  processes: Record<string, MCPServerProcess>;

  // Actions
  setProcess: (serverId: string, process: MCPServerProcess) => void;
  removeProcess: (serverId: string) => void;
  getProcess: (serverId: string) => MCPServerProcess | undefined;
  getRunningProcesses: () => MCPServerProcess[];
  updateProcessState: (serverId: string, updates: Partial<MCPServerProcess>) => void;

  // Persistence
  loadProcesses: () => void;
  saveProcesses: () => void;
}

/**
 * Registry Store State
 */
export interface RegistryStoreState {
  // Cached registry data
  servers: RegistryServerEntry[];
  categories: string[];
  selectedServer: RegistryServerEntry | null;

  // Search state
  searchResults: RegistryServerEntry[];
  isSearching: boolean;

  // Actions
  setServers: (servers: RegistryServerEntry[]) => void;
  setCategories: (categories: string[]) => void;
  setSelectedServer: (server: RegistryServerEntry | null) => void;
  setSearchResults: (results: RegistryServerEntry[]) => void;
  setIsSearching: (searching: boolean) => void;
  clearSearch: () => void;
}

