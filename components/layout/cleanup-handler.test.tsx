/**
 * @jest-environment jsdom
 */

import { render, waitFor } from '@testing-library/react';
import { CleanupHandler } from './cleanup-handler';
import { destroyConnectionPool } from '@/lib/services/connection-pool';
import { cleanupRateLimiters } from '@/lib/services/rate-limiter';

// Mock the cleanup services
jest.mock('@/lib/services/connection-pool', () => ({
  destroyConnectionPool: jest.fn(),
}));

jest.mock('@/lib/services/rate-limiter', () => ({
  cleanupRateLimiters: jest.fn(),
}));

describe('CleanupHandler', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock localStorage
    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => mockLocalStorage[key] || null),
        setItem: jest.fn((key, value) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          mockLocalStorage = {};
        }),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders without crashing and returns null', () => {
    const { container } = render(<CleanupHandler />);
    expect(container).toBeEmptyDOMElement();
  });

  it('registers beforeunload event listener on mount', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    render(<CleanupHandler />);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );

    addEventListenerSpy.mockRestore();
  });

  it('registers visibilitychange event listener on mount', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

    render(<CleanupHandler />);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );

    addEventListenerSpy.mockRestore();
  });

  it('sets up periodic cleanup interval on mount', () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    render(<CleanupHandler />);

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 300000);

    setIntervalSpy.mockRestore();
  });

  it('calls cleanup functions on beforeunload', () => {
    render(<CleanupHandler />);

    // Trigger beforeunload event
    window.dispatchEvent(new Event('beforeunload'));

    expect(destroyConnectionPool).toHaveBeenCalled();
    expect(cleanupRateLimiters).toHaveBeenCalled();
  });

  it('calls cleanup functions when visibility changes to hidden', () => {
    render(<CleanupHandler />);

    // Mock visibilityState
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      configurable: true,
      value: 'hidden',
    });

    // Trigger visibilitychange event
    document.dispatchEvent(new Event('visibilitychange'));

    expect(destroyConnectionPool).toHaveBeenCalled();
    expect(cleanupRateLimiters).toHaveBeenCalled();
  });

  it('does not call cleanup when visibility changes to visible', () => {
    render(<CleanupHandler />);

    jest.clearAllMocks();

    // Mock visibilityState
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      configurable: true,
      value: 'visible',
    });

    // Trigger visibilitychange event
    document.dispatchEvent(new Event('visibilitychange'));

    expect(destroyConnectionPool).not.toHaveBeenCalled();
    expect(cleanupRateLimiters).not.toHaveBeenCalled();
  });

  it('cleans up OAuth states older than 1 hour on beforeunload', () => {
    const now = Date.now();
    const oldTimestamp = now - 7200000; // 2 hours ago
    const recentTimestamp = now - 1800000; // 30 minutes ago

    const states = {
      'old-state': { timestamp: oldTimestamp, value: 'old' },
      'recent-state': { timestamp: recentTimestamp, value: 'recent' },
      'no-timestamp': { value: 'no-time' },
    };

    mockLocalStorage['oauth-states'] = JSON.stringify(states);

    render(<CleanupHandler />);

    // Trigger beforeunload event
    window.dispatchEvent(new Event('beforeunload'));

    const savedStates = JSON.parse(
      mockLocalStorage['oauth-states'] || '{}'
    );

    expect(savedStates['old-state']).toBeUndefined();
    expect(savedStates['recent-state']).toBeDefined();
    expect(savedStates['no-timestamp']).toBeUndefined();
  });

  it('handles missing oauth-states in localStorage', () => {
    delete mockLocalStorage['oauth-states'];

    render(<CleanupHandler />);

    expect(() => {
      window.dispatchEvent(new Event('beforeunload'));
    }).not.toThrow();
  });

  it('handles invalid JSON in oauth-states', () => {
    mockLocalStorage['oauth-states'] = 'invalid-json{';

    render(<CleanupHandler />);

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    window.dispatchEvent(new Event('beforeunload'));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Cleanup error:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('runs periodic cleanup every 5 minutes', () => {
    render(<CleanupHandler />);

    jest.clearAllMocks();

    // Fast-forward time by 5 minutes
    jest.advanceTimersByTime(300000);

    expect(cleanupRateLimiters).toHaveBeenCalled();
  });

  it('runs periodic cleanup multiple times', () => {
    render(<CleanupHandler />);

    jest.clearAllMocks();

    // Fast-forward time by 15 minutes (3 intervals)
    jest.advanceTimersByTime(900000);

    expect(cleanupRateLimiters).toHaveBeenCalledTimes(3);
  });

  it('removes event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const removeDocListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = render(<CleanupHandler />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
    expect(removeDocListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
    removeDocListenerSpy.mockRestore();
  });

  it('clears interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = render(<CleanupHandler />);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
  });

  it('calls cleanup on unmount', () => {
    const { unmount } = render(<CleanupHandler />);

    jest.clearAllMocks();

    unmount();

    expect(destroyConnectionPool).toHaveBeenCalled();
    expect(cleanupRateLimiters).toHaveBeenCalled();
  });

  it('handles cleanup errors gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (destroyConnectionPool as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Cleanup failed');
    });

    render(<CleanupHandler />);

    window.dispatchEvent(new Event('beforeunload'));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Cleanup error:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('preserves valid OAuth states during cleanup', () => {
    const now = Date.now();
    const validStates = {
      'state-1': { timestamp: now - 60000, data: 'valid' }, // 1 minute ago
      'state-2': { timestamp: now - 1800000, data: 'valid' }, // 30 minutes ago
      'state-3': { timestamp: now - 3500000, data: 'valid' }, // 58 minutes ago
    };

    mockLocalStorage['oauth-states'] = JSON.stringify(validStates);

    render(<CleanupHandler />);

    window.dispatchEvent(new Event('beforeunload'));

    const savedStates = JSON.parse(
      mockLocalStorage['oauth-states'] || '{}'
    );

    expect(Object.keys(savedStates)).toHaveLength(3);
  });
});
