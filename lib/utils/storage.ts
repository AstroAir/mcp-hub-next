/**
 * Storage utilities for data persistence and migration
 */

const STORAGE_VERSION_KEY = 'mcp-storage-version';
const CURRENT_VERSION = '1.0.0';

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get storage version
 */
export function getStorageVersion(): string | null {
  if (!isStorageAvailable()) return null;
  return localStorage.getItem(STORAGE_VERSION_KEY);
}

/**
 * Set storage version
 */
export function setStorageVersion(version: string): void {
  if (!isStorageAvailable()) return;
  localStorage.setItem(STORAGE_VERSION_KEY, version);
}

/**
 * Initialize storage with version check
 */
export function initializeStorage(): void {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available');
    return;
  }

  const currentVersion = getStorageVersion();
  
  if (!currentVersion) {
    // First time initialization
    setStorageVersion(CURRENT_VERSION);
    return;
  }

  if (currentVersion !== CURRENT_VERSION) {
    // Migration needed
    migrateStorage(currentVersion, CURRENT_VERSION);
  }
}

/**
 * Migrate storage from one version to another
 */
function migrateStorage(fromVersion: string, toVersion: string): void {
  console.log(`Migrating storage from ${fromVersion} to ${toVersion}`);
  
  // Add migration logic here as needed
  // For now, we just update the version
  setStorageVersion(toVersion);
}

/**
 * Clear all MCP-related storage
 */
export function clearAllStorage(): void {
  if (!isStorageAvailable()) return;

  const keys = [
    'mcp-servers',
    'mcp-connection-history',
    'mcp-chat-sessions',
    'mcp-current-session',
    STORAGE_VERSION_KEY,
  ];

  keys.forEach((key) => localStorage.removeItem(key));
}

/**
 * Export all data as JSON
 */
export function exportData(): string {
  if (!isStorageAvailable()) return '{}';

  const data = {
    version: CURRENT_VERSION,
    servers: localStorage.getItem('mcp-servers'),
    history: localStorage.getItem('mcp-connection-history'),
    sessions: localStorage.getItem('mcp-chat-sessions'),
    currentSession: localStorage.getItem('mcp-current-session'),
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Import data from JSON
 */
export function importData(jsonData: string): boolean {
  if (!isStorageAvailable()) return false;

  try {
    const data = JSON.parse(jsonData);
    
    if (data.servers) localStorage.setItem('mcp-servers', data.servers);
    if (data.history) localStorage.setItem('mcp-connection-history', data.history);
    if (data.sessions) localStorage.setItem('mcp-chat-sessions', data.sessions);
    if (data.currentSession) localStorage.setItem('mcp-current-session', data.currentSession);
    
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
}

/**
 * Get storage usage statistics
 */
export function getStorageStats(): {
  used: number;
  available: number;
  percentage: number;
} | null {
  if (!isStorageAvailable()) return null;

  try {
    let used = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }

    // Most browsers have a 5-10MB limit for localStorage
    const available = 5 * 1024 * 1024; // 5MB estimate
    const percentage = (used / available) * 100;

    return { used, available, percentage };
  } catch {
    return null;
  }
}

