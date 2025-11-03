'use client';

/**
 * SSEServerForm Component
 * Form for configuring SSE (Server-Sent Events) MCP servers
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { SSEMCPServerConfig } from '@/lib/types';

interface SSEServerFormProps {
  initialData?: Partial<SSEMCPServerConfig>;
  onSubmit: (config: Omit<SSEMCPServerConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function SSEServerForm({ initialData, onSubmit, onCancel }: SSEServerFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [headers, setHeaders] = useState(
    initialData?.headers
      ? Object.entries(initialData.headers)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')
      : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse headers
    const parsedHeaders: Record<string, string> = {};
    if (headers.trim()) {
      headers.split('\n').forEach((line) => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          parsedHeaders[key.trim()] = valueParts.join(':').trim();
        }
      });
    }

    onSubmit({
      name,
      description,
      transportType: 'sse',
      url,
      headers: Object.keys(parsedHeaders).length > 0 ? parsedHeaders : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My SSE Server"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">Server URL *</Label>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="http://localhost:3001/sse"
          required
        />
        <p className="text-xs text-muted-foreground">
          The SSE endpoint URL for the MCP server
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="headers">Custom Headers (Optional)</Label>
        <Textarea
          id="headers"
          value={headers}
          onChange={(e) => setHeaders(e.target.value)}
          placeholder="Authorization: Bearer token&#10;X-Custom-Header: value"
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          One header per line in format: Header-Name: value
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Server</Button>
      </div>
    </form>
  );
}

