'use client';

/**
 * Server Detail Page
 * Displays detailed information about a specific MCP server
 */

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ServerDetailView } from '@/components/mcp/server-detail-view';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { useServerStore, useConnectionStore } from '@/lib/stores';
import { ArrowLeft } from 'lucide-react';

export default function ServerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { servers } = useServerStore();
  const { connections } = useConnectionStore();

  const server = servers.find((s) => s.id === id);
  const connectionState = connections[id];

  if (!server) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Server Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The server you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/' },
          { label: server.name },
        ]}
        className="mb-6"
      />

      <ServerDetailView server={server} connectionState={connectionState} />
    </div>
  );
}

