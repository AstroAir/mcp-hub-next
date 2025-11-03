/**
 * Backup Service Tests
 * Tests for backup creation, restoration, and management
 */

import {
  getBackupSettings,
  saveBackupSettings,
  createBackup,
  getBackupHistory,
  getBackup,
  restoreBackup,
  deleteBackup,
  cleanOldBackups,
  shouldCreateAutomaticBackup,
  exportBackup,
  importBackup,
} from './backup-service';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Backup Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('getBackupSettings', () => {
    it('should return default settings when none exist', () => {
      const settings = getBackupSettings();

      expect(settings).toEqual({
        enabled: true,
        frequency: 'daily',
        maxBackups: 7,
        includeChats: true,
        includeServers: true,
        includeSettings: true,
      });
    });

    it('should return saved settings', () => {
      const savedSettings = {
        enabled: false,
        frequency: 'weekly' as const,
        maxBackups: 14,
        includeChats: false,
        includeServers: true,
        includeSettings: true,
      };

      localStorageMock.setItem(
        'mcp-hub-backup-settings',
        JSON.stringify(savedSettings)
      );

      const settings = getBackupSettings();
      expect(settings).toEqual(savedSettings);
    });

    it('should handle corrupted settings gracefully', () => {
      localStorageMock.setItem('mcp-hub-backup-settings', 'invalid json');

      const settings = getBackupSettings();
      expect(settings).toEqual({
        enabled: true,
        frequency: 'daily',
        maxBackups: 7,
        includeChats: true,
        includeServers: true,
        includeSettings: true,
      });
    });
  });

  describe('saveBackupSettings', () => {
    it('should save settings to localStorage', () => {
      const settings = {
        enabled: false,
        frequency: 'weekly' as const,
        maxBackups: 14,
        includeChats: false,
        includeServers: true,
        includeSettings: true,
      };

      saveBackupSettings(settings);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mcp-hub-backup-settings',
        JSON.stringify(settings)
      );
    });
  });

  describe('createBackup', () => {
    it('should create a backup with all data', () => {
      const mockData = {
        chats: [{ id: '1', messages: [] }],
        servers: [{ id: 'server-1', name: 'Test' }],
        settings: { theme: 'dark' },
      };

      const backup = createBackup(mockData);

      expect(backup).toMatchObject({
        id: expect.any(String),
        timestamp: expect.any(Number),
        version: '1.0',
        data: mockData,
      });
      expect(backup.id).toMatch(/^backup-\d+-[a-z0-9]+$/);
    });

    it('should save backup to localStorage', () => {
      const mockData = {
        chats: [],
        servers: [],
        settings: {},
      };

      const backup = createBackup(mockData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `mcp-hub-backup-${backup.id}`,
        JSON.stringify(backup)
      );
    });

    it('should add backup to history', () => {
      const mockData = {
        chats: [],
        servers: [],
        settings: {},
      };

      const backup = createBackup(mockData);
      const history = getBackupHistory();

      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        id: backup.id,
        timestamp: backup.timestamp,
        size: expect.any(Number),
      });
    });
  });

  describe('getBackupHistory', () => {
    it('should return empty array when no backups exist', () => {
      const history = getBackupHistory();
      expect(history).toEqual([]);
    });

    it('should return sorted backup history', () => {
      // Create multiple backups
      const backup1 = createBackup({ chats: [], servers: [], settings: {} });
      const backup2 = createBackup({ chats: [], servers: [], settings: {} });

      const history = getBackupHistory();

      expect(history).toHaveLength(2);
      // Should be sorted by timestamp descending
      expect(history[0].timestamp).toBeGreaterThanOrEqual(history[1].timestamp);
    });

    it('should handle corrupted history gracefully', () => {
      localStorageMock.setItem('mcp-hub-backup-history', 'invalid json');

      const history = getBackupHistory();
      expect(history).toEqual([]);
    });
  });

  describe('getBackup', () => {
    it('should retrieve a backup by ID', () => {
      const mockData = {
        chats: [{ id: '1' }],
        servers: [],
        settings: {},
      };

      const backup = createBackup(mockData);
      const retrieved = getBackup(backup.id);

      expect(retrieved).toEqual(backup);
    });

    it('should return null for non-existent backup', () => {
      const retrieved = getBackup('non-existent-id');
      expect(retrieved).toBeNull();
    });

    it('should handle corrupted backup data', () => {
      localStorageMock.setItem('mcp-hub-backup-test-id', 'invalid json');

      const retrieved = getBackup('test-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('restoreBackup', () => {
    it('should restore backup data', () => {
      const mockData = {
        chats: [{ id: '1', messages: [] }],
        servers: [{ id: 'server-1' }],
        settings: { theme: 'dark' },
      };

      const backup = createBackup(mockData);
      const restored = restoreBackup(backup.id);

      expect(restored).toEqual(mockData);
    });

    it('should return null for non-existent backup', () => {
      const restored = restoreBackup('non-existent-id');
      expect(restored).toBeNull();
    });
  });

  describe('deleteBackup', () => {
    it('should delete a backup and update history', () => {
      const backup = createBackup({ chats: [], servers: [], settings: {} });

      const result = deleteBackup(backup.id);

      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        `mcp-hub-backup-${backup.id}`
      );

      const history = getBackupHistory();
      expect(history).toHaveLength(0);
    });

    it('should return false for non-existent backup', () => {
      const result = deleteBackup('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('cleanOldBackups', () => {
    it('should remove backups exceeding maxBackups limit', () => {
      // Create 5 backups
      const backups = Array.from({ length: 5 }, () =>
        createBackup({ chats: [], servers: [], settings: {} })
      );

      // Clean with maxBackups = 3
      const removed = cleanOldBackups(3);

      expect(removed).toBe(2);
      const history = getBackupHistory();
      expect(history).toHaveLength(3);
    });

    it('should keep all backups if under limit', () => {
      createBackup({ chats: [], servers: [], settings: {} });
      createBackup({ chats: [], servers: [], settings: {} });

      const removed = cleanOldBackups(5);

      expect(removed).toBe(0);
      const history = getBackupHistory();
      expect(history).toHaveLength(2);
    });

    it('should remove oldest backups first', () => {
      const backup1 = createBackup({ chats: [], servers: [], settings: {} });
      const backup2 = createBackup({ chats: [], servers: [], settings: {} });
      const backup3 = createBackup({ chats: [], servers: [], settings: {} });

      cleanOldBackups(2);

      const history = getBackupHistory();
      expect(history).toHaveLength(2);
      // Should keep the newest backups
      expect(history.map((b) => b.id)).toContain(backup3.id);
      expect(history.map((b) => b.id)).toContain(backup2.id);
      expect(history.map((b) => b.id)).not.toContain(backup1.id);
    });
  });

  describe('shouldCreateAutomaticBackup', () => {
    it('should return false when backups are disabled', () => {
      saveBackupSettings({
        enabled: false,
        frequency: 'daily',
        maxBackups: 7,
        includeChats: true,
        includeServers: true,
        includeSettings: true,
      });

      expect(shouldCreateAutomaticBackup()).toBe(false);
    });

    it('should return true when no backups exist', () => {
      saveBackupSettings({
        enabled: true,
        frequency: 'daily',
        maxBackups: 7,
        includeChats: true,
        includeServers: true,
        includeSettings: true,
      });

      expect(shouldCreateAutomaticBackup()).toBe(true);
    });

    it('should return true when last backup is older than frequency', () => {
      saveBackupSettings({
        enabled: true,
        frequency: 'daily',
        maxBackups: 7,
        includeChats: true,
        includeServers: true,
        includeSettings: true,
      });

      // Create a backup from 2 days ago
      const oldBackup = createBackup({ chats: [], servers: [], settings: {} });
      const history = getBackupHistory();
      history[0].timestamp = Date.now() - 2 * 24 * 60 * 60 * 1000;
      localStorageMock.setItem(
        'mcp-hub-backup-history',
        JSON.stringify(history)
      );

      expect(shouldCreateAutomaticBackup()).toBe(true);
    });

    it('should return false when last backup is recent', () => {
      saveBackupSettings({
        enabled: true,
        frequency: 'daily',
        maxBackups: 7,
        includeChats: true,
        includeServers: true,
        includeSettings: true,
      });

      // Create a recent backup
      createBackup({ chats: [], servers: [], settings: {} });

      expect(shouldCreateAutomaticBackup()).toBe(false);
    });

    it('should handle weekly frequency correctly', () => {
      saveBackupSettings({
        enabled: true,
        frequency: 'weekly',
        maxBackups: 7,
        includeChats: true,
        includeServers: true,
        includeSettings: true,
      });

      // Create a backup from 5 days ago (should not trigger weekly backup)
      const backup = createBackup({ chats: [], servers: [], settings: {} });
      const history = getBackupHistory();
      history[0].timestamp = Date.now() - 5 * 24 * 60 * 60 * 1000;
      localStorageMock.setItem(
        'mcp-hub-backup-history',
        JSON.stringify(history)
      );

      expect(shouldCreateAutomaticBackup()).toBe(false);
    });

    it('should handle hourly frequency correctly', () => {
      saveBackupSettings({
        enabled: true,
        frequency: 'hourly',
        maxBackups: 24,
        includeChats: true,
        includeServers: true,
        includeSettings: true,
      });

      // Create a backup from 2 hours ago
      const backup = createBackup({ chats: [], servers: [], settings: {} });
      const history = getBackupHistory();
      history[0].timestamp = Date.now() - 2 * 60 * 60 * 1000;
      localStorageMock.setItem(
        'mcp-hub-backup-history',
        JSON.stringify(history)
      );

      expect(shouldCreateAutomaticBackup()).toBe(true);
    });
  });

  describe('exportBackup', () => {
    it('should export backup as JSON string', () => {
      const mockData = {
        chats: [{ id: '1', messages: [] }],
        servers: [{ id: 'server-1' }],
        settings: { theme: 'dark' },
      };

      const backup = createBackup(mockData);
      const exported = exportBackup(backup.id);

      expect(exported).toBeTruthy();
      const parsed = JSON.parse(exported!);
      expect(parsed).toEqual(backup);
    });

    it('should return null for non-existent backup', () => {
      const exported = exportBackup('non-existent-id');
      expect(exported).toBeNull();
    });
  });

  describe('importBackup', () => {
    it('should import backup from JSON string', () => {
      const mockBackup = {
        id: 'imported-backup',
        timestamp: Date.now(),
        version: '1.0',
        data: {
          chats: [{ id: '1' }],
          servers: [],
          settings: {},
        },
      };

      const jsonString = JSON.stringify(mockBackup);
      const imported = importBackup(jsonString);

      expect(imported).toEqual(mockBackup);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `mcp-hub-backup-${mockBackup.id}`,
        jsonString
      );

      const history = getBackupHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe(mockBackup.id);
    });

    it('should return null for invalid JSON', () => {
      const imported = importBackup('invalid json');
      expect(imported).toBeNull();
    });

    it('should return null for invalid backup structure', () => {
      const invalidBackup = {
        id: 'test',
        // missing required fields
      };

      const imported = importBackup(JSON.stringify(invalidBackup));
      expect(imported).toBeNull();
    });

    it('should handle duplicate backup IDs', () => {
      const backup1 = createBackup({ chats: [], servers: [], settings: {} });
      const exported = exportBackup(backup1.id);

      // Import the same backup again
      const imported = importBackup(exported!);

      expect(imported).toBeTruthy();
      const history = getBackupHistory();
      // Should still have only one entry (updated)
      expect(history).toHaveLength(1);
    });
  });

  describe('SSR Safety', () => {
    it('should handle server-side rendering gracefully', () => {
      // Temporarily remove window
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      expect(() => getBackupSettings()).not.toThrow();
      expect(() => getBackupHistory()).not.toThrow();
      expect(() => getBackup('test-id')).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });
  });
});

