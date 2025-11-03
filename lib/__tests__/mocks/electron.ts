/**
 * Electron Mocks
 * Mock implementations of Electron APIs for testing
 */

import { vi } from 'vitest';

/**
 * Mock Electron app
 */
export const mockElectronApp = {
  getName: vi.fn(() => 'MCP Server Hub'),
  getVersion: vi.fn(() => '0.1.0'),
  getPath: vi.fn((name: string) => `/mock/path/${name}`),
  quit: vi.fn(),
  exit: vi.fn(),
  relaunch: vi.fn(),
  isReady: vi.fn(() => true),
  whenReady: vi.fn(() => Promise.resolve()),
  on: vi.fn(),
  once: vi.fn(),
  removeListener: vi.fn(),
  setAppUserModelId: vi.fn(),
  requestSingleInstanceLock: vi.fn(() => true),
};

/**
 * Mock BrowserWindow
 */
export class MockBrowserWindow {
  static getAllWindows = vi.fn(() => []);
  static getFocusedWindow = vi.fn(() => null);
  
  id = Math.random();
  webContents = {
    send: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
    openDevTools: vi.fn(),
    closeDevTools: vi.fn(),
    isDevToolsOpened: vi.fn(() => false),
    loadURL: vi.fn(() => Promise.resolve()),
    loadFile: vi.fn(() => Promise.resolve()),
  };

  constructor(public options?: unknown) {}

  loadURL = vi.fn(() => Promise.resolve());
  loadFile = vi.fn(() => Promise.resolve());
  on = vi.fn();
  once = vi.fn();
  removeListener = vi.fn();
  show = vi.fn();
  hide = vi.fn();
  close = vi.fn();
  destroy = vi.fn();
  focus = vi.fn();
  blur = vi.fn();
  isFocused = vi.fn(() => false);
  isDestroyed = vi.fn(() => false);
  isVisible = vi.fn(() => true);
  isMinimized = vi.fn(() => false);
  isMaximized = vi.fn(() => false);
  isFullScreen = vi.fn(() => false);
  setFullScreen = vi.fn();
  maximize = vi.fn();
  unmaximize = vi.fn();
  minimize = vi.fn();
  restore = vi.fn();
  setTitle = vi.fn();
  getTitle = vi.fn(() => 'MCP Server Hub');
  setBounds = vi.fn();
  getBounds = vi.fn(() => ({ x: 0, y: 0, width: 800, height: 600 }));
  setSize = vi.fn();
  getSize = vi.fn(() => [800, 600]);
  setPosition = vi.fn();
  getPosition = vi.fn(() => [0, 0]);
  center = vi.fn();
}

/**
 * Mock ipcMain
 */
export const mockIpcMain = {
  on: vi.fn(),
  once: vi.fn(),
  removeListener: vi.fn(),
  removeAllListeners: vi.fn(),
  handle: vi.fn(),
  handleOnce: vi.fn(),
  removeHandler: vi.fn(),
};

/**
 * Mock ipcRenderer
 */
export const mockIpcRenderer = {
  send: vi.fn(),
  sendSync: vi.fn(),
  invoke: vi.fn(() => Promise.resolve()),
  on: vi.fn(),
  once: vi.fn(),
  removeListener: vi.fn(),
  removeAllListeners: vi.fn(),
};

/**
 * Mock dialog
 */
export const mockDialog = {
  showOpenDialog: vi.fn(() => Promise.resolve({ canceled: false, filePaths: [] })),
  showSaveDialog: vi.fn(() => Promise.resolve({ canceled: false, filePath: '' })),
  showMessageBox: vi.fn(() => Promise.resolve({ response: 0 })),
  showErrorBox: vi.fn(),
};

/**
 * Mock Menu
 */
export class MockMenu {
  static buildFromTemplate = vi.fn(() => new MockMenu());
  static setApplicationMenu = vi.fn();
  static getApplicationMenu = vi.fn(() => null);

  append = vi.fn();
  insert = vi.fn();
  popup = vi.fn();
  closePopup = vi.fn();
}

/**
 * Mock MenuItem
 */
export class MockMenuItem {
  constructor(public options: unknown) {}
}

/**
 * Mock Tray
 */
export class MockTray {
  constructor(public icon: string) {}

  setToolTip = vi.fn();
  setTitle = vi.fn();
  setImage = vi.fn();
  setContextMenu = vi.fn();
  destroy = vi.fn();
  on = vi.fn();
  once = vi.fn();
  removeListener = vi.fn();
}

/**
 * Mock shell
 */
export const mockShell = {
  openExternal: vi.fn(() => Promise.resolve()),
  openPath: vi.fn(() => Promise.resolve('')),
  showItemInFolder: vi.fn(),
  trashItem: vi.fn(() => Promise.resolve()),
};

/**
 * Mock nativeTheme
 */
export const mockNativeTheme = {
  shouldUseDarkColors: false,
  themeSource: 'system' as const,
  on: vi.fn(),
  once: vi.fn(),
  removeListener: vi.fn(),
};

/**
 * Mock clipboard
 */
export const mockClipboard = {
  readText: vi.fn(() => ''),
  writeText: vi.fn(),
  readHTML: vi.fn(() => ''),
  writeHTML: vi.fn(),
  clear: vi.fn(),
};

/**
 * Mock screen
 */
export const mockScreen = {
  getPrimaryDisplay: vi.fn(() => ({
    id: 1,
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    workArea: { x: 0, y: 0, width: 1920, height: 1040 },
    size: { width: 1920, height: 1080 },
    workAreaSize: { width: 1920, height: 1040 },
    scaleFactor: 1,
  })),
  getAllDisplays: vi.fn(() => []),
  on: vi.fn(),
  once: vi.fn(),
  removeListener: vi.fn(),
};

/**
 * Mock the entire electron module
 */
export function mockElectron() {
  vi.mock('electron', () => ({
    app: mockElectronApp,
    BrowserWindow: MockBrowserWindow,
    ipcMain: mockIpcMain,
    ipcRenderer: mockIpcRenderer,
    dialog: mockDialog,
    Menu: MockMenu,
    MenuItem: MockMenuItem,
    Tray: MockTray,
    shell: mockShell,
    nativeTheme: mockNativeTheme,
    clipboard: mockClipboard,
    screen: mockScreen,
  }));
}

/**
 * Reset all electron mocks
 */
export function resetElectronMocks() {
  Object.values(mockElectronApp).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });
  
  Object.values(mockIpcMain).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });
  
  Object.values(mockIpcRenderer).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });
  
  Object.values(mockDialog).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });
  
  Object.values(mockShell).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });
  
  Object.values(mockClipboard).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });
}

