/**
 * Backup Service Tests (aligned with current implementation)
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
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock URL and anchor download for exportBackup
const createObjectURLMock = jest.fn(() => 'blob:mock');
const revokeObjectURLMock = jest.fn();

Object.defineProperty(window.URL, 'createObjectURL', {
  value: createObjectURLMock,
});
Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: revokeObjectURLMock,
});

document.body.innerHTML = '';

describe('Backup Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('getBackupSettings/saveBackupSettings', () => {
    it('returns defaults when none exist', () => {
      const settings = getBackupSettings();
      expect(settings).toEqual({ enabled: false, frequency: 'weekly', retentionDays: 30 });
    });

    it('persists and retrieves settings', () => {
      const settings = { enabled: true, frequency: 'daily' as const, retentionDays: 7 };
      saveBackupSettings(settings);
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const roundTrip = getBackupSettings();
      expect(roundTrip).toEqual(settings);
    });
  });

  describe('create/get/history', () => {
    it('creates a backup from stored data and updates history', () => {
      // Seed some data
      localStorageMock.setItem('mcp-hub-servers', JSON.stringify([{ id: 's1' }]));
      localStorageMock.setItem('mcp-hub-chat-sessions', JSON.stringify([{ id: 'c1' }]));
      localStorageMock.setItem('mcp-hub-connection-history', JSON.stringify([{ id: 'h1' }]));

      const backup = createBackup();
      expect(backup.metadata.id).toBeTruthy();
      expect(backup.metadata.version).toBe('1.0.0');
      expect(typeof backup.metadata.timestamp).toBe('string');
      expect(backup.data.servers).toBeDefined();

      const history = getBackupHistory();
      expect(history).toHaveLength(1);
      expect(getBackup(backup.metadata.id)).toEqual(backup);
    });
  });

  describe('restore/delete/clean', () => {
    it('restores and deletes backups', () => {
      const backup = createBackup();
      // Overwrite stores to known values
      localStorageMock.setItem('mcp-hub-servers', '[]');

      expect(restoreBackup(backup.metadata.id)).toBe(true);
      expect(localStorageMock.getItem('mcp-hub-servers')).toBe(backup.data.servers);

      expect(deleteBackup(backup.metadata.id)).toBe(true);
      const history = getBackupHistory();
      expect(history).toHaveLength(0);
    });

    it('cleans backups older than retention days', () => {
      // Create two backups
      const b1 = createBackup();
      const b2 = createBackup();

      // Set retention to 0 days and make first backup old
      saveBackupSettings({ enabled: true, frequency: 'weekly', retentionDays: 0 });
      const history = getBackupHistory();
      const veryOld = new Date(2000, 0, 1).toISOString();
      const updated = history.map((h) => (h.id === b1.metadata.id ? { ...h, timestamp: veryOld } : h));
      localStorageMock.setItem('mcp-hub-backup-history', JSON.stringify(updated));

      cleanOldBackups();
      const after = getBackupHistory();
      expect(after.find((h) => h.id === b1.metadata.id)).toBeUndefined();
      expect(after.find((h) => h.id === b2.metadata.id)).toBeDefined();
    });
  });

  describe('automatic backup check', () => {
    it('returns false if disabled or manual', () => {
      saveBackupSettings({ enabled: false, frequency: 'weekly', retentionDays: 30 });
      expect(shouldCreateAutomaticBackup()).toBe(false);
      saveBackupSettings({ enabled: true, frequency: 'manual', retentionDays: 30 });
      expect(shouldCreateAutomaticBackup()).toBe(false);
    });

    it('returns true if never backed up and enabled', () => {
      saveBackupSettings({ enabled: true, frequency: 'daily', retentionDays: 30 });
      expect(shouldCreateAutomaticBackup()).toBe(true);
    });

    it('respects last backup time vs frequency', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      saveBackupSettings({ enabled: true, frequency: 'daily', retentionDays: 30, lastBackupTime: yesterday });
      expect(shouldCreateAutomaticBackup()).toBe(true);

      const recent = new Date().toISOString();
      saveBackupSettings({ enabled: true, frequency: 'daily', retentionDays: 30, lastBackupTime: recent });
      expect(shouldCreateAutomaticBackup()).toBe(false);
    });
  });

  describe('export/import', () => {
    it('exports backup via object URL and anchor click', () => {
      const b = createBackup();
      // Mock DOM methods
      const appendSpy = jest.spyOn(document.body, 'appendChild');
      const removeSpy = jest.spyOn(document.body, 'removeChild');

      exportBackup(b.metadata.id);
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(appendSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalled();
    });

    it('imports backup from File', async () => {
      const payload = createBackup();
      const file = new File([JSON.stringify(payload)], 'backup.json', { type: 'application/json' });
      // Clear first
      localStorageMock.clear();

      const result = await importBackup(file);
      expect(result).toMatchObject(payload);
      const history = getBackupHistory();
      expect(history.find((h) => h.id === payload.metadata.id)).toBeDefined();
    });
  });

  describe('SSR safety', () => {
    it('handles missing window gracefully', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      expect(() => getBackupSettings()).not.toThrow();
      expect(() => getBackupHistory()).not.toThrow();
      expect(() => getBackup('x')).not.toThrow();
      (global as any).window = originalWindow;
    });
  });
});

