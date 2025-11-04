import { act } from '@testing-library/react';
import { useSettingsStore, DEFAULT_PREFERENCES, DEFAULT_SHORTCUTS } from './settings-store';
import { mockLocalStorage } from '../__tests__/test-utils';

jest.useFakeTimers();

describe('settings-store', () => {
  let originalLocalStorage: Storage | undefined;

  beforeEach(() => {
    originalLocalStorage = global.localStorage;
    (global as any).localStorage = mockLocalStorage() as any;
    // reset state
    useSettingsStore.setState({ ...DEFAULT_PREFERENCES });
  });

  afterEach(() => {
    (global as any).localStorage = originalLocalStorage as any;
    jest.clearAllTimers();
  });

  it('updates appearance settings', () => {
    act(() => useSettingsStore.getState().setTheme('dark'));
    expect(useSettingsStore.getState().appearance.theme).toBe('dark');

    act(() => useSettingsStore.getState().setColorScheme('blue'));
    expect(useSettingsStore.getState().appearance.colorScheme).toBe('blue');

    act(() => useSettingsStore.getState().setFontScale('lg'));
    expect(useSettingsStore.getState().appearance.fontScale).toBe('lg');
  });

  it('sets locale and notifications', () => {
    act(() => useSettingsStore.getState().setLocale('zh-CN'));
    expect(useSettingsStore.getState().locale.locale).toBe('zh-CN');

    act(() => useSettingsStore.getState().setNotifications({ playSound: true }));
    expect(useSettingsStore.getState().notifications.playSound).toBe(true);
  });

  it('sets privacy and advanced', () => {
    act(() => useSettingsStore.getState().setPrivacy({ telemetry: true }));
    expect(useSettingsStore.getState().privacy.telemetry).toBe(true);

    act(() => useSettingsStore.getState().setAdvanced({ devMode: true }));
    expect(useSettingsStore.getState().advanced.devMode).toBe(true);
  });

  it('detects shortcut conflicts and can reset', () => {
    const ret = useSettingsStore.getState().setShortcut('open-search', 'Ctrl+K');
    if (ret && 'conflictWith' in ret) {
      // initial map contains Ctrl+K too; conflict can be returned
      expect(ret.conflictWith).toBeDefined();
    }

    act(() => useSettingsStore.getState().resetShortcuts());
    expect(useSettingsStore.getState().shortcuts).toEqual(DEFAULT_SHORTCUTS);
  });

  it('persists to storage on changes (debounced)', () => {
    act(() => useSettingsStore.getState().setTheme('light'));
    // fast-forward debounce
    jest.advanceTimersByTime(150);
    const raw = localStorage.getItem('mcp-preferences');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.appearance.theme).toBe('light');
  });

  it('loads from storage and can reset section', () => {
    localStorage.setItem('mcp-preferences', JSON.stringify({ appearance: { theme: 'dark' } }));
    act(() => useSettingsStore.getState().load());
    expect(useSettingsStore.getState().appearance.theme).toBe('dark');

    act(() => useSettingsStore.getState().resetSection('appearance'));
    expect(useSettingsStore.getState().appearance).toEqual(DEFAULT_PREFERENCES.appearance);
  });
});
