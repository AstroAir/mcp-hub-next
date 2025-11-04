/**
 * Settings & Shortcuts Types
 */

export type ThemeMode = 'system' | 'light' | 'dark';

export type ColorScheme =
  | 'zinc'
  | 'slate'
  | 'gray'
  | 'neutral'
  | 'stone'
  | 'blue'
  | 'violet'
  | 'emerald'
  | 'rose';

export type FontScale = 'sm' | 'md' | 'lg';

export interface AppearanceSettings {
  theme: ThemeMode;
  colorScheme: ColorScheme;
  fontScale: FontScale;
}

export interface LocaleSettings {
  locale: string; // e.g., 'en', 'zh-CN'
}

export interface NotificationSettings {
  enabled: boolean;
  playSound: boolean;
  showBadges: boolean;
}

export interface PrivacySecuritySettings {
  telemetry: boolean; // anonymous usage analytics
  crashReports: boolean;
  requireConfirmOnClear: boolean;
}

export interface AdvancedSettings {
  experimentalFeatures: boolean;
  devMode: boolean;
}

// Shortcut representation as a normalized string, e.g.:
// 'Ctrl+K', 'Meta+K', 'Shift+?','Ctrl+/' or sequences 'G D'
export type ShortcutBinding = string;

export type ShortcutAction =
  | 'open-search'
  | 'open-settings'
  | 'new'
  | 'save'
  | 'navigate-dashboard'
  | 'navigate-chat'
  | 'navigate-settings'
  | 'help'
  | 'tab-next'
  | 'tab-prev';

export interface ShortcutDefinition {
  id: ShortcutAction;
  label: string;
  description?: string;
  defaultBinding: ShortcutBinding;
}

export type ShortcutsMap = Record<ShortcutAction, ShortcutBinding>;

export interface Preferences {
  appearance: AppearanceSettings;
  locale: LocaleSettings;
  notifications: NotificationSettings;
  privacy: PrivacySecuritySettings;
  advanced: AdvancedSettings;
  shortcuts: ShortcutsMap;
}
