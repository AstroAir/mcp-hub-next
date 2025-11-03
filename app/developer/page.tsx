'use client';

/**
 * Developer Tools Page
 * Debug panel, performance metrics, and developer utilities
 */

import { useEffect } from 'react';
import { useBreadcrumbs } from '@/components/layout/breadcrumb-provider';
import { DebugPanel } from '@/components/developer/debug-panel';

export default function DeveloperPage() {
  const { setBreadcrumbs } = useBreadcrumbs();

  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs([{ label: 'Developer Tools' }]);
  }, [setBreadcrumbs]);

  return (
    <div className="container mx-auto py-4 md:py-8 px-3 md:px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Developer Tools</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Debug MCP protocol messages, monitor performance, and troubleshoot issues
          </p>
        </div>

        <DebugPanel />
      </div>
    </div>
  );
}

