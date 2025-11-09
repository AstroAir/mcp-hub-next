"use client";

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useBreadcrumbs } from '@/components/layout/breadcrumb-provider';
import { AppearanceSettings } from '@/components/settings/appearance-settings';
import { AdvancedSettings } from '@/components/settings/advanced-settings';
import { BackupManagement } from '@/components/settings/backup-management';
import { KeyboardShortcutsEditor } from '@/components/settings/keyboard-shortcuts-editor';
import { LocaleSettings } from '@/components/settings/locale-settings';
import { ModelSettings } from '@/components/settings/model-settings';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { PrivacySecuritySettings } from '@/components/settings/privacy-security-settings';
import { UpdateSettings } from '@/components/settings/update-settings';

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const nav = useTranslations('common.navigation');
  const t = useTranslations('settings.page');
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: nav('settings'), href: '/settings' }]);
  }, [nav, setBreadcrumbs]);

  return (
    <div className="w-full py-6 px-4 md:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <AppearanceSettings />
            <ModelSettings />
            <LocaleSettings />
            <NotificationSettings />
          </div>

          <div className="space-y-6">
            <BackupManagement />
            <PrivacySecuritySettings />
            <KeyboardShortcutsEditor />
            <AdvancedSettings />
            <UpdateSettings />
          </div>
        </section>
      </div>
    </div>
  );
}
