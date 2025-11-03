/**
 * Backup Service
 * Handles automatic backups, backup history, and restore functionality
 */

import { nanoid } from 'nanoid';

export interface BackupMetadata {
  id: string;
  timestamp: string;
  version: string;
  size: number;
  itemCounts: {
    servers: number;
    chatSessions: number;
    connections: number;
  };
}

export interface BackupData {
  metadata: BackupMetadata;
  data: {
    servers?: string;
    chatSessions?: string;
    chatMessages?: string;
    connectionHistory?: string;
    settings?: string;
  };
}

export interface BackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  retentionDays: number;
  lastBackupTime?: string;
}

const BACKUP_HISTORY_KEY = 'mcp-hub-backup-history';
const BACKUP_SETTINGS_KEY = 'mcp-hub-backup-settings';
const BACKUP_PREFIX = 'mcp-hub-backup-';

/**
 * Get backup settings
 */
export function getBackupSettings(): BackupSettings {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      frequency: 'weekly',
      retentionDays: 30,
    };
  }

  const stored = localStorage.getItem(BACKUP_SETTINGS_KEY);
  if (!stored) {
    return {
      enabled: false,
      frequency: 'weekly',
      retentionDays: 30,
    };
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse backup settings:', error);
    return {
      enabled: false,
      frequency: 'weekly',
      retentionDays: 30,
    };
  }
}

/**
 * Save backup settings
 */
export function saveBackupSettings(settings: BackupSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Create a backup of all data
 */
export function createBackup(): BackupData {
  if (typeof window === 'undefined') {
    throw new Error('Backups can only be created in browser environment');
  }

  const servers = localStorage.getItem('mcp-hub-servers') || '[]';
  const chatSessions = localStorage.getItem('mcp-hub-chat-sessions') || '[]';
  const chatMessages = localStorage.getItem('mcp-hub-chat-messages') || '{}';
  const connectionHistory = localStorage.getItem('mcp-hub-connection-history') || '[]';
  const settings = localStorage.getItem(BACKUP_SETTINGS_KEY) || '{}';

  const serversData = JSON.parse(servers);
  const sessionsData = JSON.parse(chatSessions);
  const connectionsData = JSON.parse(connectionHistory);

  const backup: BackupData = {
    metadata: {
      id: nanoid(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      size: servers.length + chatSessions.length + chatMessages.length + connectionHistory.length + settings.length,
      itemCounts: {
        servers: serversData.length,
        chatSessions: sessionsData.length,
        connections: connectionsData.length,
      },
    },
    data: {
      servers,
      chatSessions,
      chatMessages,
      connectionHistory,
      settings,
    },
  };

  // Save to backup history
  const history = getBackupHistory();
  history.push(backup.metadata);
  localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(history));

  // Save backup data
  localStorage.setItem(`${BACKUP_PREFIX}${backup.metadata.id}`, JSON.stringify(backup));

  // Update last backup time
  const backupSettings = getBackupSettings();
  backupSettings.lastBackupTime = backup.metadata.timestamp;
  saveBackupSettings(backupSettings);

  // Clean old backups
  cleanOldBackups();

  return backup;
}

/**
 * Get backup history
 */
export function getBackupHistory(): BackupMetadata[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(BACKUP_HISTORY_KEY);
  if (!stored) return [];

  const history = JSON.parse(stored);

  // Sort by timestamp in reverse chronological order (newest first)
  return history.sort((a: BackupMetadata, b: BackupMetadata) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

/**
 * Get a specific backup by ID
 */
export function getBackup(backupId: string): BackupData | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(`${BACKUP_PREFIX}${backupId}`);
  if (!stored) return null;

  return JSON.parse(stored);
}

/**
 * Restore from a backup
 */
export function restoreBackup(
  backupId: string,
  options: {
    servers?: boolean;
    chatSessions?: boolean;
    chatMessages?: boolean;
    connectionHistory?: boolean;
    settings?: boolean;
  } = {}
): boolean {
  if (typeof window === 'undefined') return false;

  const backup = getBackup(backupId);
  if (!backup) return false;

  // Default to restoring everything if no options specified
  const restoreAll = !Object.values(options).some((v) => v === true);

  if (restoreAll || options.servers) {
    if (backup.data.servers) {
      localStorage.setItem('mcp-hub-servers', backup.data.servers);
    }
  }

  if (restoreAll || options.chatSessions) {
    if (backup.data.chatSessions) {
      localStorage.setItem('mcp-hub-chat-sessions', backup.data.chatSessions);
    }
  }

  if (restoreAll || options.chatMessages) {
    if (backup.data.chatMessages) {
      localStorage.setItem('mcp-hub-chat-messages', backup.data.chatMessages);
    }
  }

  if (restoreAll || options.connectionHistory) {
    if (backup.data.connectionHistory) {
      localStorage.setItem('mcp-hub-connection-history', backup.data.connectionHistory);
    }
  }

  if (restoreAll || options.settings) {
    if (backup.data.settings) {
      localStorage.setItem(BACKUP_SETTINGS_KEY, backup.data.settings);
    }
  }

  return true;
}

/**
 * Delete a backup
 */
export function deleteBackup(backupId: string): boolean {
  if (typeof window === 'undefined') return false;

  // Remove from history
  const history = getBackupHistory();
  const newHistory = history.filter((b) => b.id !== backupId);
  localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(newHistory));

  // Remove backup data
  localStorage.removeItem(`${BACKUP_PREFIX}${backupId}`);

  return true;
}

/**
 * Clean old backups based on retention policy
 */
export function cleanOldBackups(): void {
  if (typeof window === 'undefined') return;

  const settings = getBackupSettings();
  const history = getBackupHistory();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - settings.retentionDays);

  const toDelete = history.filter((backup) => {
    const backupDate = new Date(backup.timestamp);
    return backupDate < cutoffDate;
  });

  toDelete.forEach((backup) => {
    deleteBackup(backup.id);
  });
}

/**
 * Check if automatic backup is needed
 */
export function shouldCreateAutomaticBackup(): boolean {
  if (typeof window === 'undefined') return false;

  const settings = getBackupSettings();
  if (!settings.enabled || settings.frequency === 'manual') {
    return false;
  }

  if (!settings.lastBackupTime) {
    return true;
  }

  const lastBackup = new Date(settings.lastBackupTime);
  const now = new Date();
  const hoursSinceLastBackup = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60);

  switch (settings.frequency) {
    case 'daily':
      return hoursSinceLastBackup >= 24;
    case 'weekly':
      return hoursSinceLastBackup >= 24 * 7;
    case 'monthly':
      return hoursSinceLastBackup >= 24 * 30;
    default:
      return false;
  }
}

/**
 * Export backup as downloadable file
 */
export function exportBackup(backupId: string): void {
  if (typeof window === 'undefined') return;

  const backup = getBackup(backupId);
  if (!backup) return;

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mcp-hub-backup-${backup.metadata.timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import backup from file
 */
export async function importBackup(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string) as BackupData;

        // Validate backup structure
        if (!backup.metadata || !backup.data) {
          throw new Error('Invalid backup file format');
        }

        // Save to backup history
        const history = getBackupHistory();
        history.push(backup.metadata);
        localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(history));

        // Save backup data
        localStorage.setItem(`${BACKUP_PREFIX}${backup.metadata.id}`, JSON.stringify(backup));

        resolve(backup);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read backup file'));
    };

    reader.readAsText(file);
  });
}

