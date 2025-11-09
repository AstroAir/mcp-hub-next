import { useTranslations } from 'next-intl';

export default function SettingsLoading() {
  const t = useTranslations('settings.page');
  return (
    <div className="container mx-auto py-12 px-4 text-center">
      <div className="text-lg font-medium">{t('loading.title')}</div>
      <div className="text-sm text-muted-foreground mt-2">{t('loading.description')}</div>
    </div>
  );
}
