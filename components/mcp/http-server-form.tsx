'use client';

/**
 * HTTPServerForm Component
 * Form for configuring HTTP MCP servers
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('components.serverForms');
  const actions = useTranslations('common.actions');
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
        <Label htmlFor="name">{t('common.nameLabel')}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('http.namePlaceholder')}
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
        <Label htmlFor="url">{t('http.urlLabel')}</Label>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t('http.urlPlaceholder')}
          required
        />
        <p className="text-xs text-muted-foreground">{t('http.urlHelp')}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="method">{t('http.methodLabel')}</Label>
        <Select value={method} onValueChange={(v) => setMethod(v as 'GET' | 'POST')}>
          <SelectTrigger id="method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="POST">{t('http.methodOptions.post')}</SelectItem>
            <SelectItem value="GET">{t('http.methodOptions.get')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeout">{t('http.timeoutLabel')}</Label>
        <Input
          id="timeout"
          type="number"
          value={timeout}
          onChange={(e) => setTimeout(e.target.value)}
          placeholder={t('http.timeoutPlaceholder')}
          min="1000"
          max="300000"
        />
        <p className="text-xs text-muted-foreground">{t('http.timeoutHelp')}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="authType">{t('http.auth.label')}</Label>
        <Select value={authType} onValueChange={(v) => setAuthType(v as AuthType)}>
          <SelectTrigger id="authType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('http.auth.options.none')}</SelectItem>
            <SelectItem value="bearer">{t('http.auth.options.bearer')}</SelectItem>
            <SelectItem value="apikey">{t('http.auth.options.apikey')}</SelectItem>
            <SelectItem value="basic">{t('http.auth.options.basic')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {authType === 'bearer' && (
        <div className="space-y-2">
          <Label htmlFor="authToken">{t('http.auth.bearer.label')}</Label>
          <Input
            id="authToken"
            type="password"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            placeholder={t('http.auth.bearer.placeholder')}
            required
          />
        </div>
      )}

      {authType === 'apikey' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="apiKeyHeader">{t('http.auth.apiKey.headerLabel')}</Label>
            <Input
              id="apiKeyHeader"
              value={apiKeyHeader}
              onChange={(e) => setApiKeyHeader(e.target.value)}
              placeholder={t('http.auth.apiKey.headerPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKeyValue">{t('http.auth.apiKey.valueLabel')}</Label>
            <Input
              id="apiKeyValue"
              type="password"
              value={apiKeyValue}
              onChange={(e) => setApiKeyValue(e.target.value)}
              placeholder={t('http.auth.apiKey.valuePlaceholder')}
              required
            />
          </div>
        </>
      )}

      {authType === 'basic' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="authUsername">{t('http.auth.basic.usernameLabel')}</Label>
            <Input
              id="authUsername"
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
              placeholder={t('http.auth.basic.usernamePlaceholder')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authPassword">{t('http.auth.basic.passwordLabel')}</Label>
            <Input
              id="authPassword"
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder={t('http.auth.basic.passwordPlaceholder')}
              required
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="headers">{t('http.headers.label')}</Label>
        <Textarea
          id="headers"
          value={headers}
          onChange={(e) => setHeaders(e.target.value)}
          placeholder={t('http.headers.placeholder')}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">{t('http.headers.help')}</p>
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

