"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useModelStore } from '@/lib/stores/model-store';
import type { ModelProvider } from '@/lib/types';
import { Plus, Trash2, Save } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

const PROVIDER_IDS: ModelProvider[] = [
  'anthropic',
  'openai',
  'google',
  'ollama',
  'mistral',
  'together',
  'azure-openai',
  'other',
];

export function ModelSettings() {
  const t = useTranslations('settings.models');
  const { models, providerAuth, addModel, updateModel, removeModel, setDefaultModel, defaultModelId, setProviderAuth } = useModelStore();
  const [draft, setDraft] = useState({ id: '', label: '', provider: 'openai' as ModelProvider });

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-semibold">{t('sections.models')}</h3>
            <div className="space-y-3">
              {models.map((m) => (
                <div key={m.id} className="border rounded-lg p-3 space-y-3">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label>{t('table.label')}</Label>
                      <Input value={m.label} onChange={(e) => updateModel(m.id, { label: e.target.value })} />
                    </div>
                    <div>
                      <Label>{t('table.modelId')}</Label>
                      <Input value={m.id} onChange={(e) => updateModel(m.id, { id: e.target.value })} />
                    </div>
                    <div>
                      <Label>{t('table.provider')}</Label>
                      <Select value={m.provider} onValueChange={(v) => updateModel(m.id, { provider: v as ModelProvider })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVIDER_IDS.map((id) => (
                            <SelectItem key={id} value={id}>{t(`providers.${id}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label>{t('table.temperature')}</Label>
                      <Input type="number" step="0.1" value={m.defaultParams?.temperature ?? ''} onChange={(e) => updateModel(m.id, { defaultParams: { ...m.defaultParams, temperature: parseFloat(e.target.value) } })} />
                    </div>
                    <div>
                      <Label>{t('table.maxTokens')}</Label>
                      <Input type="number" value={m.defaultParams?.maxTokens ?? ''} onChange={(e) => updateModel(m.id, { defaultParams: { ...m.defaultParams, maxTokens: parseInt(e.target.value || '0', 10) } })} />
                    </div>
                    <div>
                      <Label>{t('table.topP')}</Label>
                      <Input type="number" step="0.1" value={m.defaultParams?.topP ?? ''} onChange={(e) => updateModel(m.id, { defaultParams: { ...m.defaultParams, topP: parseFloat(e.target.value) } })} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant={defaultModelId === m.id ? 'default' : 'outline'} size="sm" onClick={() => setDefaultModel(m.id)}>
                      <Save className="h-4 w-4 mr-1" /> {t('table.default')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeModel(m.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" /> {t('table.remove')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label>{t('form.label.label')}</Label>
                <Input placeholder={t('form.label.placeholder')} value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} />
              </div>
              <div>
                <Label>{t('form.modelId.label')}</Label>
                <Input placeholder={t('form.modelId.placeholder')} value={draft.id} onChange={(e) => setDraft((d) => ({ ...d, id: e.target.value }))} />
              </div>
              <div>
                <Label>{t('form.provider.label')}</Label>
                <Select value={draft.provider} onValueChange={(v) => setDraft((d) => ({ ...d, provider: v as ModelProvider }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.provider.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_IDS.map((id) => (
                      <SelectItem key={id} value={id}>{t(`providers.${id}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (!draft.id || !draft.label) return;
                addModel({ id: draft.id, label: draft.label, provider: draft.provider });
                setDraft({ id: '', label: '', provider: 'openai' });
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> {t('form.addModel')}
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">{t('sections.providerKeys')}</h3>
            <div className="space-y-3">
              {PROVIDER_IDS.map((id) => (
                <div key={id} className="border rounded-lg p-3 space-y-2">
                  <div className="font-medium">{t(`providers.${id}`)}</div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label>{t('providerKeys.apiKey.label')}</Label>
                      <Input
                        placeholder={t('providerKeys.apiKey.placeholder')}
                        value={providerAuth[id]?.apiKeyClient ?? ''}
                        onChange={(e) => setProviderAuth(id, { apiKeyClient: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{t('providerKeys.apiKey.description')}</p>
                    </div>
                    <div>
                      <Label>{t('providerKeys.baseUrl.label')}</Label>
                      <Input
                        placeholder={id === 'ollama' ? t('providerKeys.baseUrl.placeholder') : t('providerKeys.baseUrl.description')}
                        value={providerAuth[id]?.baseUrl ?? ''}
                        onChange={(e) => setProviderAuth(id, { baseUrl: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>{t('providerKeys.envVar.label')}</Label>
                      <Input disabled value={providerAuth[id]?.apiKeyEnv ?? ''} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('providerKeys.envVar.description')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
