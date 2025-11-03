'use client';

/**
 * StdioServerForm Component
 * Form for configuring stdio MCP servers
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { StdioMCPServerConfig } from '@/lib/types';

interface StdioServerFormProps {
  initialData?: Partial<StdioMCPServerConfig>;
  onSubmit: (data: Omit<StdioMCPServerConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function StdioServerForm({ initialData, onSubmit, onCancel }: StdioServerFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [command, setCommand] = useState(initialData?.command || '');
  const [args, setArgs] = useState(initialData?.args?.join(' ') || '');
  const [env, setEnv] = useState(
    initialData?.env ? Object.entries(initialData.env).map(([k, v]) => `${k}=${v}`).join('\n') : ''
  );
  const [cwd, setCwd] = useState(initialData?.cwd || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const envObject: Record<string, string> = {};
    if (env.trim()) {
      env.split('\n').forEach((line) => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envObject[key.trim()] = valueParts.join('=').trim();
        }
      });
    }

    onSubmit({
      name,
      description: description || undefined,
      transportType: 'stdio',
      command,
      args: args.trim() ? args.trim().split(/\s+/) : undefined,
      env: Object.keys(envObject).length > 0 ? envObject : undefined,
      cwd: cwd || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Server Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My MCP Server"
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
        <Label htmlFor="command">Command *</Label>
        <Input
          id="command"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="npx"
          required
        />
        <p className="text-xs text-muted-foreground">
          The command to execute (e.g., npx, node, python)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="args">Arguments</Label>
        <Input
          id="args"
          value={args}
          onChange={(e) => setArgs(e.target.value)}
          placeholder="-y @modelcontextprotocol/server-filesystem /path/to/dir"
        />
        <p className="text-xs text-muted-foreground">
          Space-separated arguments for the command
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="env">Environment Variables</Label>
        <Textarea
          id="env"
          value={env}
          onChange={(e) => setEnv(e.target.value)}
          placeholder="KEY=value&#10;ANOTHER_KEY=another_value"
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          One per line in KEY=value format
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cwd">Working Directory</Label>
        <Input
          id="cwd"
          value={cwd}
          onChange={(e) => setCwd(e.target.value)}
          placeholder="/path/to/working/directory"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Server</Button>
      </div>
    </form>
  );
}

