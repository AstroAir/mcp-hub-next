'use client';

/**
 * Developer Tools Page
 * Debug panel, performance metrics, and developer utilities
 */

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useBreadcrumbs } from '@/components/layout/breadcrumb-provider';
import { DebugPanel } from '@/components/developer/debug-panel';

export default function DeveloperPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const t = useTranslations('developerPage');
  const navigation = useTranslations('common.navigation');

  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs([{ label: navigation('developer') }]);
  }, [navigation, setBreadcrumbs]);

  return (
    <div className="w-full py-4 md:py-8 px-3 md:px-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('hero.title')}</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            {t('hero.description')}
          </p>
        </div>

        <DebugPanel />
      </div>
    </div>
  );
}
