/**
 * Mock for i18n/routing module
 */

export const locales = ["en", "zh-CN"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const routing = {
  locales,
  defaultLocale,
  localePrefix: "as-needed",
};

