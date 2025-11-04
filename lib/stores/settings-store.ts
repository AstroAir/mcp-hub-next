/**
 * Settings Store - User preferences & keyboard shortcuts
 */

import { create } from 'zustand';
import type {
  SettingsStoreState,
  Preferences,
  ShortcutAction,
  ShortcutsMap,
  ThemeMode,
  ColorScheme,
  FontScale,
} from '@/lib/types';

const STORAGE_KEY = 'mcp-preferences';

const DEFAULT_SHORTCUTS: ShortcutsMap = {
  'open-search': 'Meta+K|Ctrl+K', // allow either Meta+K or Ctrl+K
  'open-settings': 'Meta+,|Ctrl+,',
  'new': 'Meta+N|Ctrl+N',
  'save': 'Meta+S|Ctrl+S',
  'navigate-dashboard': 'G D',
  'navigate-chat': 'G C',
  'navigate-settings': 'G S',
  'help': 'Shift+?|Meta+/|Ctrl+/',
  'tab-next': 'Ctrl+Tab',
  'tab-prev': 'Ctrl+Shift+Tab',
};

const DEFAULT_PREFERENCES: Preferences = {
  appearance: {
    theme: 'system',
    colorScheme: 'zinc',
    fontScale: 'md',
  },
  locale: {
    locale: 'en',
  },
  notifications: {
    enabled: true,
    playSound: false,
    showBadges: true,
  },
  privacy: {
    telemetry: false,
    crashReports: true,
    requireConfirmOnClear: true,
  },
  advanced: {
    experimentalFeatures: false,
    devMode: false,
  },
  shortcuts: DEFAULT_SHORTCUTS,
};

function loadFromStorage(): Preferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      appearance: { ...DEFAULT_PREFERENCES.appearance, ...(parsed.appearance || {}) },
      locale: { ...DEFAULT_PREFERENCES.locale, ...(parsed.locale || {}) },
      notifications: { ...DEFAULT_PREFERENCES.notifications, ...(parsed.notifications || {}) },
      privacy: { ...DEFAULT_PREFERENCES.privacy, ...(parsed.privacy || {}) },
      advanced: { ...DEFAULT_PREFERENCES.advanced, ...(parsed.advanced || {}) },
      shortcuts: { ...DEFAULT_SHORTCUTS, ...(parsed.shortcuts || {}) },
    };
  } catch (e) {
    console.error('Failed to load preferences:', e);
    return DEFAULT_PREFERENCES;
  }
}

function saveToStorage(prefs: Preferences) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save preferences:', e);
  }
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  ...DEFAULT_PREFERENCES,

  // Appearance
  setTheme: (theme: ThemeMode) => set((s) => ({ appearance: { ...s.appearance, theme } })),
  setColorScheme: (colorScheme: ColorScheme) => set((s) => ({ appearance: { ...s.appearance, colorScheme } })),
  setFontScale: (fontScale: FontScale) => set((s) => ({ appearance: { ...s.appearance, fontScale } })),

  // Locale
  setLocale: (locale: string) => set((s) => ({ locale: { ...s.locale, locale } })),

  // Notifications
  setNotifications: (patch) => set((s) => ({ notifications: { ...s.notifications, ...patch } })),

  // Privacy & Security
  setPrivacy: (patch) => set((s) => ({ privacy: { ...s.privacy, ...patch } })),

  // Advanced
  setAdvanced: (patch) => set((s) => ({ advanced: { ...s.advanced, ...patch } })),

  // Shortcuts
  setShortcut: (action: ShortcutAction, binding: string) => {
    const currentShortcuts = get().shortcuts;
    // Conflict detection: check if any other action has same binding token set
    const normalized = binding.trim();
    let conflictWith: ShortcutAction | undefined;
    for (const [act, b] of Object.entries(currentShortcuts) as [ShortcutAction, string][]) {
      if (act === action) continue;
      // if any token overlaps
      const setA = new Set(normalized.split('|').map((t) => t.trim()));
      const setB = new Set(b.split('|').map((t) => t.trim()));
      for (const tok of setA) {
        if (setB.has(tok)) {
          conflictWith = act as ShortcutAction;
          break;
        }
      }
      if (conflictWith) break;
    }

    if (conflictWith) {
      // set anyway but return conflict info
      set((s) => ({ shortcuts: { ...s.shortcuts, [action]: normalized } }));
      return { conflictWith };
    }
    set((s) => ({ shortcuts: { ...s.shortcuts, [action]: normalized } }));
  },

  resetShortcuts: () => set({ shortcuts: DEFAULT_SHORTCUTS }),

  // Persistence
  load: () => set(loadFromStorage()),
  save: () => saveToStorage(get() as Preferences),

  resetSection: (section) => {
    if (section === 'appearance') set(() => ({ appearance: { ...DEFAULT_PREFERENCES.appearance } }));
    else if (section === 'locale') set(() => ({ locale: { ...DEFAULT_PREFERENCES.locale } }));
    else if (section === 'notifications') set(() => ({ notifications: { ...DEFAULT_PREFERENCES.notifications } }));
    else if (section === 'privacy') set(() => ({ privacy: { ...DEFAULT_PREFERENCES.privacy } }));
    else if (section === 'advanced') set(() => ({ advanced: { ...DEFAULT_PREFERENCES.advanced } }));
    else if (section === 'shortcuts') set(() => ({ shortcuts: { ...DEFAULT_SHORTCUTS } }));
  },
}));

// Initialize from storage client-side
if (typeof window !== 'undefined') {
  const loaded = loadFromStorage();
  useSettingsStore.setState(loaded);
  // Save on any change (debounced in simple way)
  let t: number | undefined;
  useSettingsStore.subscribe((prefs) => {
    window.clearTimeout(t);
    t = window.setTimeout(() => saveToStorage(prefs as Preferences), 100);
  });
}

export { DEFAULT_PREFERENCES, DEFAULT_SHORTCUTS };
