'use client';

/**
 * HTTPServerForm Component
 * Form for configuring HTTP MCP servers
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { HTTPMCPServerConfig } from '@/lib/types';

type AuthType = 'none' | 'bearer' | 'apikey' | 'basic';

interface HTTPServerFormProps {
  initialData?: Partial<HTTPMCPServerConfig>;
  onSubmit: (config: Omit<HTTPMCPServerConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function HTTPServerForm({ initialData, onSubmit, onCancel }: HTTPServerFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [method, setMethod] = useState<'GET' | 'POST'>(initialData?.method || 'POST');
  const [authType, setAuthType] = useState<AuthType>('none');
  const [authToken, setAuthToken] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [apiKeyHeader, setApiKeyHeader] = useState('X-API-Key');
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [timeout, setTimeout] = useState(initialData?.timeout?.toString() || '30000');
  const [headers, setHeaders] = useState(
    initialData?.headers
      ? Object.entries(initialData.headers)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')
      : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse custom headers
    const parsedHeaders: Record<string, string> = {};
    if (headers.trim()) {
      headers.split('\n').forEach((line) => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          parsedHeaders[key.trim()] = valueParts.join(':').trim();
        }
      });
    }

    // Add authentication headers
    if (authType === 'bearer' && authToken) {
      parsedHeaders['Authorization'] = `Bearer ${authToken}`;
    } else if (authType === 'apikey' && apiKeyValue) {
      parsedHeaders[apiKeyHeader] = apiKeyValue;
    } else if (authType === 'basic' && authUsername && authPassword) {
      const credentials = btoa(`${authUsername}:${authPassword}`);
      parsedHeaders['Authorization'] = `Basic ${credentials}`;
    }

    onSubmit({
      name,
      description,
      transportType: 'http',
      url,
      method,
      headers: Object.keys(parsedHeaders).length > 0 ? parsedHeaders : undefined,
      timeout: parseInt(timeout, 10),
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
          placeholder="My HTTP Server"
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
          placeholder="https://api.example.com/mcp"
          required
        />
        <p className="text-xs text-muted-foreground">
          The HTTP endpoint URL for the MCP server
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="method">HTTP Method</Label>
        <Select value={method} onValueChange={(v) => setMethod(v as 'GET' | 'POST')}>
          <SelectTrigger id="method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="GET">GET</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeout">Request Timeout (ms)</Label>
        <Input
          id="timeout"
          type="number"
          value={timeout}
          onChange={(e) => setTimeout(e.target.value)}
          placeholder="30000"
          min="1000"
          max="300000"
        />
        <p className="text-xs text-muted-foreground">
          Timeout in milliseconds (1000-300000)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="authType">Authentication</Label>
        <Select value={authType} onValueChange={(v) => setAuthType(v as AuthType)}>
          <SelectTrigger id="authType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="bearer">Bearer Token</SelectItem>
            <SelectItem value="apikey">API Key</SelectItem>
            <SelectItem value="basic">Basic Auth</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {authType === 'bearer' && (
        <div className="space-y-2">
          <Label htmlFor="authToken">Bearer Token *</Label>
          <Input
            id="authToken"
            type="password"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            placeholder="your-bearer-token"
            required
          />
        </div>
      )}

      {authType === 'apikey' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="apiKeyHeader">API Key Header Name</Label>
            <Input
              id="apiKeyHeader"
              value={apiKeyHeader}
              onChange={(e) => setApiKeyHeader(e.target.value)}
              placeholder="X-API-Key"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKeyValue">API Key Value *</Label>
            <Input
              id="apiKeyValue"
              type="password"
              value={apiKeyValue}
              onChange={(e) => setApiKeyValue(e.target.value)}
              placeholder="your-api-key"
              required
            />
          </div>
        </>
      )}

      {authType === 'basic' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="authUsername">Username *</Label>
            <Input
              id="authUsername"
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
              placeholder="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authPassword">Password *</Label>
            <Input
              id="authPassword"
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="password"
              required
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="headers">Additional Headers (Optional)</Label>
        <Textarea
          id="headers"
          value={headers}
          onChange={(e) => setHeaders(e.target.value)}
          placeholder="Content-Type: application/json&#10;X-Custom-Header: value"
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

