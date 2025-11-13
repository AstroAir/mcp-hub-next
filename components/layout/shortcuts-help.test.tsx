/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShortcutsHelp } from './shortcuts-help';
import { useSettingsStore } from '@/lib/stores/settings-store';

// Mock settings store
jest.mock('@/lib/stores/settings-store', () => ({
  useSettingsStore: jest.fn(),
}));

// Mock formatBinding utility
jest.mock('@/lib/utils/shortcuts', () => ({
  formatBinding: jest.fn((binding: string) => binding),
}));

describe('ShortcutsHelp', () => {
  const defaultShortcuts = {
    'open-search': 'Ctrl+K',
    'open-settings': 'Ctrl+,',
    'new': 'Ctrl+N',
    'save': 'Ctrl+S',
    'help': 'Shift+?',
    'navigate-dashboard': 'G D',
    'navigate-chat': 'G C',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useSettingsStore as jest.Mock).mockReturnValue({
      shortcuts: defaultShortcuts,
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<ShortcutsHelp />);
    expect(container).toBeInTheDocument();
  });

  it('is initially closed', () => {
    render(<ShortcutsHelp />);

    // Dialog content should not be visible
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('opens when shortcuts-help:toggle event is dispatched', async () => {
    render(<ShortcutsHelp />);

    window.dispatchEvent(new CustomEvent('shortcuts-help:toggle'));

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
  });

  it('opens when shortcuts-help:open event is dispatched', async () => {
    render(<ShortcutsHelp />);

    window.dispatchEvent(new CustomEvent('shortcuts-help:open'));

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
  });

  it('closes when shortcuts-help:close event is dispatched', async () => {
    render(<ShortcutsHelp />);

    // Open the dialog first
    window.dispatchEvent(new CustomEvent('shortcuts-help:open'));

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    // Close the dialog
    window.dispatchEvent(new CustomEvent('shortcuts-help:close'));

    await waitFor(() => {
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });
  });

  it('toggles visibility on multiple toggle events', async () => {
    render(<ShortcutsHelp />);

    // First toggle - opens
    window.dispatchEvent(new CustomEvent('shortcuts-help:toggle'));

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    // Second toggle - closes
    window.dispatchEvent(new CustomEvent('shortcuts-help:toggle'));

    await waitFor(() => {
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });
  });

  it('displays all shortcuts from settings', async () => {
    render(<ShortcutsHelp />);

    window.dispatchEvent(new CustomEvent('shortcuts-help:open'));

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    // Check that all shortcuts are displayed
    Object.keys(defaultShortcuts).forEach((shortcutId) => {
      expect(screen.getByText(shortcutId)).toBeInTheDocument();
    });
  });

  it('displays shortcut bindings', async () => {
    render(<ShortcutsHelp />);

    window.dispatchEvent(new CustomEvent('shortcuts-help:open'));

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    // Check that bindings are displayed
    Object.values(defaultShortcuts).forEach((binding) => {
      expect(screen.getByText(binding)).toBeInTheDocument();
    });
  });

  it('displays the help tip at the bottom', async () => {
    render(<ShortcutsHelp />);

    window.dispatchEvent(new CustomEvent('shortcuts-help:open'));

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Press Shift\+\? or Ctrl\/Cmd\+\/ to toggle this panel/)
    ).toBeInTheDocument();
  });

  it('removes event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = render(<ShortcutsHelp />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'shortcuts-help:toggle',
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'shortcuts-help:open',
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'shortcuts-help:close',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  it('handles empty shortcuts object', async () => {
    (useSettingsStore as jest.Mock).mockReturnValue({
      shortcuts: {},
    });

    render(<ShortcutsHelp />);

    window.dispatchEvent(new CustomEvent('shortcuts-help:open'));

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    // Should render the dialog but with no shortcut entries
    // The dialog should open successfully even with empty shortcuts
    // Check that there are no shortcut ID entries displayed
    const shortcuts = Object.keys(defaultShortcuts);
    shortcuts.forEach((shortcutId) => {
      expect(screen.queryByText(shortcutId)).not.toBeInTheDocument();
    });

    // The help tip should still be displayed
    expect(
      screen.getByText(/Press Shift\+\? or Ctrl\/Cmd\+\/ to toggle this panel/)
    ).toBeInTheDocument();
  });

  it('updates shortcuts when settings change', async () => {
    const { rerender } = render(<ShortcutsHelp />);

    window.dispatchEvent(new CustomEvent('shortcuts-help:open'));

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    // Check initial shortcuts
    expect(screen.getByText('open-search')).toBeInTheDocument();

    // Update shortcuts
    const newShortcuts = {
      'custom-shortcut': 'Ctrl+X',
    };

    (useSettingsStore as jest.Mock).mockReturnValue({
      shortcuts: newShortcuts,
    });

    rerender(<ShortcutsHelp />);

    await waitFor(() => {
      expect(screen.queryByText('open-search')).not.toBeInTheDocument();
      expect(screen.getByText('custom-shortcut')).toBeInTheDocument();
    });
  });

  it('has accessible dialog structure', async () => {
    render(<ShortcutsHelp />);

    window.dispatchEvent(new CustomEvent('shortcuts-help:open'));

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    // Check for dialog role
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('displays shortcuts in a scrollable area', async () => {
    render(<ShortcutsHelp />);

    window.dispatchEvent(new CustomEvent('shortcuts-help:open'));

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    // ScrollArea should be rendered (check for the specific content structure)
    const shortcutsList = screen.getByText('open-search').closest('div');
    expect(shortcutsList).toBeInTheDocument();
  });

  it('displays each shortcut with its ID and binding', async () => {
    render(<ShortcutsHelp />);

    window.dispatchEvent(new CustomEvent('shortcuts-help:open'));

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    // Check a specific shortcut
    expect(screen.getByText('open-search')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+K')).toBeInTheDocument();

    expect(screen.getByText('save')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+S')).toBeInTheDocument();
  });

  it('calls formatBinding for each shortcut binding', async () => {
    const formatBinding = require('@/lib/utils/shortcuts').formatBinding;

    render(<ShortcutsHelp />);

    window.dispatchEvent(new CustomEvent('shortcuts-help:open'));

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    // formatBinding should be called for each shortcut
    expect(formatBinding).toHaveBeenCalledWith('Ctrl+K');
    expect(formatBinding).toHaveBeenCalledWith('Ctrl+,');
    expect(formatBinding).toHaveBeenCalledWith('Ctrl+N');
  });

  it('handles rapid open/close events', async () => {
    render(<ShortcutsHelp />);

    // Rapidly dispatch toggle events
    window.dispatchEvent(new CustomEvent('shortcuts-help:toggle'));
    window.dispatchEvent(new CustomEvent('shortcuts-help:toggle'));
    window.dispatchEvent(new CustomEvent('shortcuts-help:toggle'));

    // Should end up open (1 + 2 closes, 3 opens)
    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
  });

  it('maintains state across multiple open/close cycles', async () => {
    render(<ShortcutsHelp />);

    // Open
    window.dispatchEvent(new CustomEvent('shortcuts-help:open'));
    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    // Close
    window.dispatchEvent(new CustomEvent('shortcuts-help:close'));
    await waitFor(() => {
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });

    // Open again
    window.dispatchEvent(new CustomEvent('shortcuts-help:open'));
    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
  });
});
