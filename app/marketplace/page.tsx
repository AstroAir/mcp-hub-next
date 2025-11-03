'use client';

import { useEffect } from 'react';
import { useBreadcrumbs } from '@/components/layout/breadcrumb-provider';
import { MarketplaceView } from '@/components/marketplace/marketplace-view';

export default function MarketplacePage() {
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Marketplace', href: '/marketplace' },
    ]);
  }, [setBreadcrumbs]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <MarketplaceView />
    </div>
  );
}

