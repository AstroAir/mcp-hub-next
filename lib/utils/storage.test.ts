import {
  isStorageAvailable,
  getStorageVersion,
  setStorageVersion,
  initializeStorage,
  clearAllStorage,
  exportData,
  importData,
  getStorageStats,
} from './storage';
import { mockLocalStorage, mockConsole } from '../__tests__/test-utils';

describe('storage utils', () => {
  let originalLocalStorage: Storage | undefined;

  beforeEach(() => {
    originalLocalStorage = global.localStorage;
    (global as any).localStorage = mockLocalStorage() as any;
  });

  afterEach(() => {
    (global as any).localStorage = originalLocalStorage as any;
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('detects storage availability', () => {
    expect(isStorageAvailable()).toBe(true);
  });

  it('reads and writes storage version', () => {
    expect(getStorageVersion()).toBe(null);
    setStorageVersion('2.0.0');
    expect(getStorageVersion()).toBe('2.0.0');
  });

  it('initializes storage and sets version or migrates', () => {
    const c = mockConsole();
    // First init: no version set yet
    initializeStorage();
    expect(getStorageVersion()).toBeTruthy();

    // Simulate older version to force migration
    setStorageVersion('0.0.1');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    initializeStorage();
    expect(spy).toHaveBeenCalled();
    c.warn.mockRestore();
    spy.mockRestore();
  });

  it('clears all known keys', () => {
    localStorage.setItem('mcp-servers', '[]');
    localStorage.setItem('mcp-connection-history', '[]');
    localStorage.setItem('mcp-chat-sessions', '[]');
    localStorage.setItem('mcp-current-session', 'abc');
    setStorageVersion('1.0.0');

    clearAllStorage();
    expect(localStorage.getItem('mcp-servers')).toBeNull();
    expect(localStorage.getItem('mcp-connection-history')).toBeNull();
    expect(localStorage.getItem('mcp-chat-sessions')).toBeNull();
    expect(localStorage.getItem('mcp-current-session')).toBeNull();
    expect(getStorageVersion()).toBeNull();
  });

  it('exports and imports data', () => {
    localStorage.setItem('mcp-servers', '[1]');
    localStorage.setItem('mcp-connection-history', '[2]');
    localStorage.setItem('mcp-chat-sessions', '[3]');
    localStorage.setItem('mcp-current-session', 's1');

    const json = exportData();
    const obj = JSON.parse(json);
    expect(obj.version).toBeTruthy();
    expect(obj.servers).toBe('[1]');

    localStorage.clear();
    const ok = importData(json);
    expect(ok).toBe(true);
    expect(localStorage.getItem('mcp-servers')).toBe('[1]');
  });

  it('handles invalid import data', () => {
    const c = mockConsole();
    const ok = importData('{"bad"');
    expect(ok).toBe(false);
    expect(c.error).toHaveBeenCalled();
  });

  it('computes storage stats', () => {
    localStorage.setItem('a', '1');
    const stats = getStorageStats();
    expect(stats).not.toBeNull();
    expect(stats!.available).toBeGreaterThan(0);
    expect(stats!.percentage).toBeGreaterThan(0);
  });
});
