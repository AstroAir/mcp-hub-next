/**
 * Mock for next-intl module
 */

export const useTranslations = (namespace?: string) => {
  return (key: string, values?: Record<string, unknown>) => {
    if (values) {
      return `${namespace ? `${namespace}.` : ''}${key}`;
    }
    return `${namespace ? `${namespace}.` : ''}${key}`;
  };
};

export const useLocale = () => 'en';

export const useMessages = () => ({});

export const NextIntlClientProvider = ({ children }: { children: React.ReactNode }) => children;

// Mock for next-intl/routing
export const defineRouting = (config: unknown) => config;

