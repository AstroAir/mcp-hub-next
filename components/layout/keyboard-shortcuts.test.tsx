/**
 * @jest-environment jsdom
 */

import { render, waitFor } from '@testing-library/react';
import { KeyboardShortcuts } from './keyboard-shortcuts';
import { useUIStore } from '@/lib/stores';
import { useSettingsStore } from '@/lib/stores/settings-store';

// Mock stores
jest.mock('@/lib/stores', () => ({
  useUIStore: jest.fn(),
}));

jest.mock('@/lib/stores/settings-store', () => ({
  useSettingsStore: jest.fn(),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/',
}));

// Mock command palette hook
const mockOpenPalette = jest.fn();
jest.mock('@/lib/hooks/use-command-palette', () => ({
  useCommandPalette: () => ({
    open: mockOpenPalette,
  }),
}));

describe('KeyboardShortcuts', () => {
  const mockOpenServerForm = jest.fn();
  const defaultShortcuts = {
    'open-search': 'Ctrl+K',
    'open-settings': 'Ctrl+,',
    'new': 'Ctrl+N',
    'save': 'Ctrl+S',
    'help': 'Shift+?',
    'tab-next': 'Ctrl+Tab',
    'tab-prev': 'Ctrl+Shift+Tab',
    'navigate-dashboard': 'G D',
    'navigate-chat': 'G C',
    'navigate-settings': 'G S',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    (useUIStore as jest.Mock).mockReturnValue({
      openServerForm: mockOpenServerForm,
    });

    (useSettingsStore as jest.Mock).mockReturnValue({
      shortcuts: defaultShortcuts,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders without crashing and returns null', () => {
    const { container } = render(<KeyboardShortcuts />);
    expect(container).toBeEmptyDOMElement();
  });

  it('registers keydown event listener on mount', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    render(<KeyboardShortcuts />);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );

    addEventListenerSpy.mockRestore();
  });

  it('removes keydown event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = render(<KeyboardShortcuts />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  it('ignores keyboard events from input elements', () => {
    render(<KeyboardShortcuts />);

    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });

    Object.defineProperty(event, 'target', { value: input, enumerable: true });

    input.dispatchEvent(event);

    expect(mockOpenPalette).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('ignores keyboard events from textarea elements', () => {
    render(<KeyboardShortcuts />);

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });

    Object.defineProperty(event, 'target', {
      value: textarea,
      enumerable: true,
    });

    textarea.dispatchEvent(event);

    expect(mockOpenPalette).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });

  it('ignores keyboard events from select elements', () => {
    render(<KeyboardShortcuts />);

    const select = document.createElement('select');
    document.body.appendChild(select);

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });

    Object.defineProperty(event, 'target', { value: select, enumerable: true });

    select.dispatchEvent(event);

    expect(mockOpenPalette).not.toHaveBeenCalled();

    document.body.removeChild(select);
  });

  it('opens command palette on Ctrl+K', () => {
    render(<KeyboardShortcuts />);

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(mockOpenPalette).toHaveBeenCalled();
  });

  it('navigates to settings on Ctrl+,', () => {
    render(<KeyboardShortcuts />);

    const event = new KeyboardEvent('keydown', {
      key: ',',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('opens server form on Ctrl+N', () => {
    render(<KeyboardShortcuts />);

    const event = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(mockOpenServerForm).toHaveBeenCalled();
  });

  it('dispatches global-save event on Ctrl+S', () => {
    render(<KeyboardShortcuts />);

    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'global-save',
      })
    );

    dispatchEventSpy.mockRestore();
  });

  it('dispatches shortcuts-help:toggle event on Shift+?', () => {
    render(<KeyboardShortcuts />);

    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

    const event = new KeyboardEvent('keydown', {
      key: '?',
      shiftKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'shortcuts-help:toggle',
      })
    );

    dispatchEventSpy.mockRestore();
  });

  it('handles G D sequence to navigate to dashboard', () => {
    render(<KeyboardShortcuts />);

    // Press G
    const gEvent = new KeyboardEvent('keydown', {
      key: 'g',
      bubbles: true,
    });
    window.dispatchEvent(gEvent);

    // Press D
    const dEvent = new KeyboardEvent('keydown', {
      key: 'd',
      bubbles: true,
    });
    window.dispatchEvent(dEvent);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('handles G C sequence to navigate to chat', () => {
    render(<KeyboardShortcuts />);

    // Press G
    const gEvent = new KeyboardEvent('keydown', {
      key: 'g',
      bubbles: true,
    });
    window.dispatchEvent(gEvent);

    // Press C
    const cEvent = new KeyboardEvent('keydown', {
      key: 'c',
      bubbles: true,
    });
    window.dispatchEvent(cEvent);

    expect(mockPush).toHaveBeenCalledWith('/chat');
  });

  it('handles G S sequence to navigate to settings', () => {
    render(<KeyboardShortcuts />);

    // Press G
    const gEvent = new KeyboardEvent('keydown', {
      key: 'g',
      bubbles: true,
    });
    window.dispatchEvent(gEvent);

    // Press S
    const sEvent = new KeyboardEvent('keydown', {
      key: 's',
      bubbles: true,
    });
    window.dispatchEvent(sEvent);

    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('resets G sequence after 1 second timeout', () => {
    render(<KeyboardShortcuts />);

    // Press G
    const gEvent = new KeyboardEvent('keydown', {
      key: 'g',
      bubbles: true,
    });
    window.dispatchEvent(gEvent);

    // Fast-forward time by 1 second
    jest.advanceTimersByTime(1000);

    // Press D (should not trigger navigation since G timed out)
    const dEvent = new KeyboardEvent('keydown', {
      key: 'd',
      bubbles: true,
    });
    window.dispatchEvent(dEvent);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('ignores G with modifier keys', () => {
    render(<KeyboardShortcuts />);

    jest.clearAllMocks();

    // Press G with Ctrl
    const gEvent = new KeyboardEvent('keydown', {
      key: 'g',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(gEvent);

    // Press D
    const dEvent = new KeyboardEvent('keydown', {
      key: 'd',
      bubbles: true,
    });
    window.dispatchEvent(dEvent);

    // Should not navigate because G was pressed with Ctrl
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('dispatches global-tab-next event on Ctrl+Tab', () => {
    render(<KeyboardShortcuts />);

    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'global-tab-next',
      })
    );

    dispatchEventSpy.mockRestore();
  });

  it('dispatches global-tab-prev event on Ctrl+Shift+Tab', () => {
    render(<KeyboardShortcuts />);

    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'global-tab-prev',
      })
    );

    dispatchEventSpy.mockRestore();
  });

  it('prevents default on matched shortcuts', () => {
    render(<KeyboardShortcuts />);

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });

    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();

    preventDefaultSpy.mockRestore();
  });

  it('handles sequence reset between different sequences', () => {
    render(<KeyboardShortcuts />);

    // First sequence: G D
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', bubbles: true }));

    expect(mockPush).toHaveBeenCalledWith('/');
    jest.clearAllMocks();

    // Second sequence: G C
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));

    expect(mockPush).toHaveBeenCalledWith('/chat');
  });

  it('handles case-insensitive G sequences', () => {
    render(<KeyboardShortcuts />);

    // Press lowercase g
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));

    // Press uppercase D (should work)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'D', bubbles: true }));

    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
