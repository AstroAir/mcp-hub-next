'use client';

/**
 * Developer Tools Page
 * Debug panel, performance metrics, and developer utilities
 */

import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { DebugPanel } from '@/components/developer/debug-panel';

export default function DeveloperPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Breadcrumbs items={[{ label: 'Developer Tools' }]} className="mb-6" />

      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Developer Tools</h1>
          <p className="text-muted-foreground mt-2">
            Debug MCP protocol messages, monitor performance, and troubleshoot issues
          </p>
        </div>

        <DebugPanel />
      </div>
    </div>
  );
}

