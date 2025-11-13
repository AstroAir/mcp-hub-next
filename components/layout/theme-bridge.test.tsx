/**
 * @jest-environment jsdom
 */

import { render, waitFor } from '@testing-library/react';
import { ThemeBridge } from './theme-bridge';
import { useSettingsStore } from '@/lib/stores/settings-store';

// Mock next-themes
const mockSetTheme = jest.fn();
jest.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
  }),
}));

// Mock settings store
jest.mock('@/lib/stores/settings-store', () => ({
  useSettingsStore: jest.fn(),
}));

describe('ThemeBridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.style.fontSize = '';
    document.body.className = '';
  });

  it('renders without crashing', () => {
    (useSettingsStore as jest.Mock).mockReturnValue({
      appearance: {
        theme: 'light',
        fontScale: 'md',
        colorScheme: 'default',
      },
    });

    const { container } = render(<ThemeBridge />);
    expect(container).toBeEmptyDOMElement();
  });

  it('syncs theme with next-themes', () => {
    (useSettingsStore as jest.Mock).mockReturnValue({
      appearance: {
        theme: 'dark',
        fontScale: 'md',
        colorScheme: 'default',
      },
    });

    render(<ThemeBridge />);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('updates theme when appearance.theme changes', () => {
    const { rerender } = render(<ThemeBridge />);

    (useSettingsStore as jest.Mock).mockReturnValue({
      appearance: {
        theme: 'light',
        fontScale: 'md',
        colorScheme: 'default',
      },
    });
    rerender(<ThemeBridge />);
    expect(mockSetTheme).toHaveBeenCalledWith('light');

    (useSettingsStore as jest.Mock).mockReturnValue({
      appearance: {
        theme: 'dark',
        fontScale: 'md',
        colorScheme: 'default',
      },
    });
    rerender(<ThemeBridge />);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('sets font size to 14px for small scale', () => {
    (useSettingsStore as jest.Mock).mockReturnValue({
      appearance: {
        theme: 'light',
        fontScale: 'sm',
        colorScheme: 'default',
      },
    });

    render(<ThemeBridge />);
    expect(document.documentElement.style.fontSize).toBe('14px');
  });

  it('sets font size to 16px for medium scale', () => {
    (useSettingsStore as jest.Mock).mockReturnValue({
      appearance: {
        theme: 'light',
        fontScale: 'md',
        colorScheme: 'default',
      },
    });

    render(<ThemeBridge />);
    expect(document.documentElement.style.fontSize).toBe('16px');
  });

  it('sets font size to 18px for large scale', () => {
    (useSettingsStore as jest.Mock).mockReturnValue({
      appearance: {
        theme: 'light',
        fontScale: 'lg',
        colorScheme: 'default',
      },
    });

    render(<ThemeBridge />);
    expect(document.documentElement.style.fontSize).toBe('18px');
  });

  it('adds color scheme class to body', () => {
    (useSettingsStore as jest.Mock).mockReturnValue({
      appearance: {
        theme: 'light',
        fontScale: 'md',
        colorScheme: 'blue',
      },
    });

    render(<ThemeBridge />);
    expect(document.body.classList.contains('theme-blue')).toBe(true);
  });

  it('removes old theme class when color scheme changes', () => {
    const { rerender } = render(<ThemeBridge />);

    (useSettingsStore as jest.Mock).mockReturnValue({
      appearance: {
        theme: 'light',
        fontScale: 'md',
        colorScheme: 'blue',
      },
    });
    rerender(<ThemeBridge />);
    expect(document.body.classList.contains('theme-blue')).toBe(true);

    (useSettingsStore as jest.Mock).mockReturnValue({
      appearance: {
        theme: 'light',
        fontScale: 'md',
        colorScheme: 'green',
      },
    });
    rerender(<ThemeBridge />);
    expect(document.body.classList.contains('theme-blue')).toBe(false);
    expect(document.body.classList.contains('theme-green')).toBe(true);
  });

  it('updates font size when fontScale changes', () => {
    const { rerender } = render(<ThemeBridge />);

    (useSettingsStore as jest.Mock).mockReturnValue({
      appearance: {
        theme: 'light',
        fontScale: 'sm',
        colorScheme: 'default',
      },
    });
    rerender(<ThemeBridge />);
    expect(document.documentElement.style.fontSize).toBe('14px');

    (useSettingsStore as jest.Mock).mockReturnValue({
      appearance: {
        theme: 'light',
        fontScale: 'lg',
        colorScheme: 'default',
      },
    });
    rerender(<ThemeBridge />);
    expect(document.documentElement.style.fontSize).toBe('18px');
  });

  it('handles system theme', () => {
    (useSettingsStore as jest.Mock).mockReturnValue({
      appearance: {
        theme: 'system',
        fontScale: 'md',
        colorScheme: 'default',
      },
    });

    render(<ThemeBridge />);
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('handles multiple color scheme changes', () => {
    const { rerender } = render(<ThemeBridge />);

    const schemes = ['default', 'blue', 'green', 'purple'];
    schemes.forEach((scheme) => {
      (useSettingsStore as jest.Mock).mockReturnValue({
        appearance: {
          theme: 'light',
          fontScale: 'md',
          colorScheme: scheme,
        },
      });
      rerender(<ThemeBridge />);
      expect(document.body.classList.contains(`theme-${scheme}`)).toBe(true);
    });
  });

  it('cleans up old theme classes properly', async () => {
    // Set initial state
    (useSettingsStore as jest.Mock).mockReturnValue({
      appearance: {
        theme: 'light',
        fontScale: 'md',
        colorScheme: 'old1',
      },
    });

    const { rerender } = render(<ThemeBridge />);

    // Wait for initial effect to complete
    await waitFor(() => {
      expect(document.body.classList.contains('theme-old1')).toBe(true);
    });

    // Manually add additional old theme classes and a non-theme class
    document.body.classList.add('theme-old2', 'other-class');

    // Change to new color scheme
    (useSettingsStore as jest.Mock).mockReturnValue({
      appearance: {
        theme: 'light',
        fontScale: 'md',
        colorScheme: 'new',
      },
    });
    rerender(<ThemeBridge />);

    // Wait for effect to complete and verify all old theme classes are removed
    await waitFor(() => {
      expect(document.body.classList.contains('theme-new')).toBe(true);
    });

    expect(document.body.classList.contains('theme-old1')).toBe(false);
    expect(document.body.classList.contains('theme-old2')).toBe(false);
    expect(document.body.classList.contains('other-class')).toBe(true);
  });
});

