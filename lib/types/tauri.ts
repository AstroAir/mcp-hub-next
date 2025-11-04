/**
 * Tauri API Type Definitions
 * Types for Tauri commands and events
 */

/**
 * Update preferences configuration
 */
export interface UpdatePreferences {
  autoDownload: boolean;
  autoInstallOnAppQuit: boolean;
  channel: 'stable' | 'beta' | 'alpha';
  checkOnStartup: boolean;
  lastCheckTime?: number;
}

/**
 * Update status information
 */
export interface UpdateStatus {
  event: 'checking-for-update' | 'update-available' | 'update-not-available' |
         'download-progress' | 'update-downloaded' | 'update-error';
  data?: {
    version?: string;
    releaseNotes?: string;
    percent?: number;
    message?: string;
  };
  updateDownloaded?: boolean;
}

/**
 * Update notification data
 */
export interface UpdateNotificationData {
  title: string;
  message: string;
  actions?: Array<{ label: string; action: string }>;
}

/**
 * File filter for file dialogs
 */
export interface FileFilter {
  name: string;
  extensions: string[];
}

/**
 * File metadata information
 */
export interface FileMetadata {
  size: number;
  isFile: boolean;
  isDir: boolean;
  modified?: number;
  created?: number;
}

/**
 * Tauri Commands
 * All available Tauri commands that can be invoked from the frontend
 */
export interface TauriCommands {
  // Update commands
  get_app_version: () => Promise<string>;
  get_update_preferences: () => Promise<UpdatePreferences>;
  set_update_preferences: (preferences: UpdatePreferences) => Promise<void>;
  get_update_status: () => Promise<UpdateStatus | null>;
  check_for_updates: () => Promise<void>;
  quit_and_install: () => Promise<void>;

  // Storage commands
  get_app_data_path: () => Promise<string>;
  save_servers: (servers: string) => Promise<void>;
  load_servers: () => Promise<string>;
  save_chat_sessions: (sessions: string) => Promise<void>;
  load_chat_sessions: () => Promise<string>;
  save_settings: (settings: string) => Promise<void>;
  load_settings: () => Promise<string>;
  save_connection_history: (history: string) => Promise<void>;
  load_connection_history: () => Promise<string>;
  save_backup: (backupId: string, data: string) => Promise<void>;
  load_backup: (backupId: string) => Promise<string>;
  delete_backup: (backupId: string) => Promise<void>;
  list_backups: () => Promise<string[]>;
  clear_all_data: () => Promise<void>;

  // File dialog commands
  open_file_dialog: (title?: string, filters?: FileFilter[]) => Promise<string | null>;
  open_files_dialog: (title?: string, filters?: FileFilter[]) => Promise<string[]>;
  save_file_dialog: (title?: string, defaultName?: string, filters?: FileFilter[]) => Promise<string | null>;
  open_folder_dialog: (title?: string) => Promise<string | null>;
  read_file: (path: string) => Promise<string>;
  write_file: (path: string, content: string) => Promise<void>;
  read_file_binary: (path: string) => Promise<number[]>;
  write_file_binary: (path: string, content: number[]) => Promise<void>;
  file_exists: (path: string) => Promise<boolean>;
  get_file_metadata: (path: string) => Promise<FileMetadata>;
  show_message_dialog: (title: string, message: string, kind?: 'info' | 'warning' | 'error') => Promise<void>;
  show_confirm_dialog: (title: string, message: string) => Promise<boolean>;

  // Secure storage commands
  save_credential: (key: string, value: string) => Promise<void>;
  get_credential: (key: string) => Promise<string | null>;
  delete_credential: (key: string) => Promise<void>;
  has_credential: (key: string) => Promise<boolean>;
  save_oauth_token: (serverId: string, token: string) => Promise<void>;
  get_oauth_token: (serverId: string) => Promise<string | null>;
  delete_oauth_token: (serverId: string) => Promise<void>;
  save_api_key: (service: string, apiKey: string) => Promise<void>;
  get_api_key: (service: string) => Promise<string | null>;
  delete_api_key: (service: string) => Promise<void>;
  save_encrypted_data: (key: string, data: string) => Promise<void>;
  get_encrypted_data: (key: string) => Promise<string | null>;
  delete_encrypted_data: (key: string) => Promise<void>;
  clear_all_credentials: () => Promise<void>;

  // MCP lifecycle commands (stdio processes)
  mcp_start_server: (args: { serverId: string; config?: Record<string, unknown> }) => Promise<unknown>;
  mcp_stop_server: (args: { serverId: string; force?: boolean }) => Promise<{ serverId: string }>;
  mcp_restart_server: (args: { serverId: string; config?: Record<string, unknown> }) => Promise<unknown>;
  mcp_get_status: (args: { serverId: string }) => Promise<unknown>;
  mcp_list_running: () => Promise<unknown>;

  // MCP installer commands
  validate_install: (args: { config: Record<string, unknown> }) => Promise<unknown>;
  install_server: (args: { config: Record<string, unknown>; serverName: string; serverDescription?: string; autoStart?: boolean }) => Promise<unknown>;
  get_install_progress: (args: { installId: string }) => Promise<unknown>;
  cancel_install: (args: { installId: string }) => Promise<{ installId: string }>;
  cleanup_install: (args: { installId: string }) => Promise<void>;

  // MCP registry commands
  registry_search: (args: { filters: Record<string, unknown> }) => Promise<unknown>;
  registry_categories: () => Promise<string[]>;
  registry_popular: (args?: { limit?: number; source?: 'npm' | 'github' }) => Promise<unknown>;
  registry_refresh: () => Promise<void>;
}

