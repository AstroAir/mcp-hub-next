'use client';

/**
 * SSEServerForm Component
 * Form for configuring SSE (Server-Sent Events) MCP servers
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('components.serverForms');
  const actions = useTranslations('common.actions');
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
        <Label htmlFor="name">{t('common.nameLabel')}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('sse.namePlaceholder')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('common.descriptionLabel')}</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('common.descriptionPlaceholder')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">{t('sse.urlLabel')}</Label>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t('sse.urlPlaceholder')}
          required
        />
        <p className="text-xs text-muted-foreground">{t('sse.urlHelp')}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="headers">{t('sse.headersLabel')}</Label>
        <Textarea
          id="headers"
          value={headers}
          onChange={(e) => setHeaders(e.target.value)}
          placeholder={t('sse.headersPlaceholder')}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">{t('sse.headersHelp')}</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {actions('cancel')}
        </Button>
        <Button type="submit">{t('common.submit')}</Button>
      </div>
    </form>
  );
}

