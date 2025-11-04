/**
 * Test Utilities
 * Shared utilities for testing React components and hooks
 */

import { ReactElement } from 'react';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const jest: any;
import { render, RenderOptions } from '@testing-library/react';
import { BreadcrumbProvider } from '@/components/layout/breadcrumb-provider';

/**
 * Custom render function that wraps components with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <BreadcrumbProvider>
      {children as ReactElement}
    </BreadcrumbProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
}

/**
 * Mock fetch
 */
export function mockFetch() {
  return jest.fn(() => {
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      json: async () => ({}),
      text: async () => '',
      blob: async () => new Blob(),
      arrayBuffer: async () => new ArrayBuffer(0),
      formData: async () => new FormData(),
      clone: () => ({} as Response),
      body: null,
      bodyUsed: false,
      redirected: false,
      type: 'basic' as ResponseType,
      url: '',
    } as Response);
  });
}

/**
 * Wait for async operations
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock file
 */
export function createMockFile(
  name: string,
  content: string,
  type: string = 'text/plain'
): File {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

/**
 * Mock console methods
 */
export function mockConsole() {
  return {
    log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    error: jest.spyOn(console, 'error').mockImplementation(() => {}),
    warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
    info: jest.spyOn(console, 'info').mockImplementation(() => {}),
  };
}

/**
 * Restore console methods
 */
export function restoreConsole(mocks: ReturnType<typeof mockConsole>) {
  mocks.log.mockRestore();
  mocks.error.mockRestore();
  mocks.warn.mockRestore();
  mocks.info.mockRestore();
}

/**
 * Create a deferred promise for testing async operations
 */
export function createDeferred<T>() {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
}

/**
 * Mock crypto.getRandomValues for testing
 */
export function mockCrypto() {
  const originalCrypto = global.crypto;

  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: jest.fn((arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
      subtle: {
        digest: jest.fn(async (algorithm: string, data: BufferSource) => {
          // Simple mock hash
          const str = new TextDecoder().decode(data);
          const hash = new Uint8Array(32);
          for (let i = 0; i < str.length && i < 32; i++) {
            hash[i] = str.charCodeAt(i);
          }
          return hash.buffer;
        }),
      },
    },
    writable: true,
    configurable: true,
  });

  return () => {
    Object.defineProperty(global, 'crypto', {
      value: originalCrypto,
      writable: true,
      configurable: true,
    });
  };
}

/**
 * Mock window.matchMedia
 */
export function mockMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

/**
 * Mock IntersectionObserver
 */
export function mockIntersectionObserver() {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as unknown as typeof IntersectionObserver;
}

/**
 * Mock ResizeObserver
 */
export function mockResizeObserver() {
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver;
}

/**
 * Setup common browser mocks
 */
export function setupBrowserMocks() {
  mockMatchMedia();
  mockIntersectionObserver();
  mockResizeObserver();
}

/**
 * Cleanup browser mocks
 */
export function cleanupBrowserMocks() {
  // Reset to undefined to allow re-mocking
  delete (global as { IntersectionObserver?: unknown }).IntersectionObserver;
  delete (global as { ResizeObserver?: unknown }).ResizeObserver;
}

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
