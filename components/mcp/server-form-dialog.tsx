'use client';

/**
 * ServerFormDialog Component
 * Modal dialog for creating/editing MCP servers
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StdioServerForm } from './stdio-server-form';
import { SSEServerForm } from './sse-server-form';
import { HTTPServerForm } from './http-server-form';
import type { MCPServerConfig, MCPTransportType } from '@/lib/types';
import { Terminal, Radio, Globe } from 'lucide-react';

interface ServerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (config: Omit<MCPServerConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: MCPServerConfig;
}

export function ServerFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: ServerFormDialogProps) {
  const [transportType, setTransportType] = useState<MCPTransportType>(
    initialData?.transportType || 'stdio'
  );

  const handleSubmit = (data: Omit<MCPServerConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit MCP Server' : 'Add New MCP Server'}
          </DialogTitle>
          <DialogDescription>
            Configure your MCP server connection. Choose the transport type and fill in the required details.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={transportType} onValueChange={(v) => setTransportType(v as MCPTransportType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stdio" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Stdio
            </TabsTrigger>
            <TabsTrigger value="sse" className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              SSE
            </TabsTrigger>
            <TabsTrigger value="http" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              HTTP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stdio" className="mt-4">
            <StdioServerForm
              initialData={initialData?.transportType === 'stdio' ? initialData : undefined}
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>

          <TabsContent value="sse" className="mt-4">
            <SSEServerForm
              initialData={initialData?.transportType === 'sse' ? initialData : undefined}
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>

          <TabsContent value="http" className="mt-4">
            <HTTPServerForm
              initialData={initialData?.transportType === 'http' ? initialData : undefined}
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

