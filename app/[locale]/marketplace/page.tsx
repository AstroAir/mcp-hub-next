'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useBreadcrumbs } from '@/components/layout/breadcrumb-provider';
import { MarketplaceView } from '@/components/marketplace/marketplace-view';

export default function MarketplacePage() {
  const nav = useTranslations('common.navigation');
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: nav('marketplace'), href: '/marketplace' }]);
  }, [nav, setBreadcrumbs]);

  return (
    <div className="w-full px-4 md:px-6 py-6">
      <MarketplaceView gridColumns={{ base: 1, md: 2, lg: 3, xl: 4, ['2xl']: 5 }} />
    </div>
  );
}
