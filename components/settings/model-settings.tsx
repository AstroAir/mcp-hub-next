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

const PROVIDERS: { id: ModelProvider; label: string }[] = [
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'google', label: 'Google (Gemini)' },
  { id: 'ollama', label: 'Ollama (Local)' },
  { id: 'mistral', label: 'Mistral' },
  { id: 'together', label: 'Together' },
  { id: 'azure-openai', label: 'Azure OpenAI' },
  { id: 'other', label: 'Other' },
];

export function ModelSettings() {
  const { models, providerAuth, addModel, updateModel, removeModel, setDefaultModel, defaultModelId, setProviderAuth } = useModelStore();
  const [draft, setDraft] = useState({ id: '', label: '', provider: 'openai' as ModelProvider });

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle>AI Models</CardTitle>
        <CardDescription>Configure models, provider API keys, and defaults.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-semibold">Models</h3>
            <div className="space-y-3">
              {models.map((m) => (
                <div key={m.id} className="border rounded-lg p-3 space-y-3">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label>Label</Label>
                      <Input value={m.label} onChange={(e) => updateModel(m.id, { label: e.target.value })} />
                    </div>
                    <div>
                      <Label>Model ID</Label>
                      <Input value={m.id} onChange={(e) => updateModel(m.id, { id: e.target.value })} />
                    </div>
                    <div>
                      <Label>Provider</Label>
                      <Select value={m.provider} onValueChange={(v) => updateModel(m.id, { provider: v as ModelProvider })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVIDERS.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label>Temperature</Label>
                      <Input type="number" step="0.1" value={m.defaultParams?.temperature ?? ''} onChange={(e) => updateModel(m.id, { defaultParams: { ...m.defaultParams, temperature: parseFloat(e.target.value) } })} />
                    </div>
                    <div>
                      <Label>Max tokens</Label>
                      <Input type="number" value={m.defaultParams?.maxTokens ?? ''} onChange={(e) => updateModel(m.id, { defaultParams: { ...m.defaultParams, maxTokens: parseInt(e.target.value || '0', 10) } })} />
                    </div>
                    <div>
                      <Label>Top P</Label>
                      <Input type="number" step="0.1" value={m.defaultParams?.topP ?? ''} onChange={(e) => updateModel(m.id, { defaultParams: { ...m.defaultParams, topP: parseFloat(e.target.value) } })} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant={defaultModelId === m.id ? 'default' : 'outline'} size="sm" onClick={() => setDefaultModel(m.id)}>
                      <Save className="h-4 w-4 mr-1" /> Default
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeModel(m.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label>Label</Label>
                <Input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} />
              </div>
              <div>
                <Label>Model ID</Label>
                <Input value={draft.id} onChange={(e) => setDraft((d) => ({ ...d, id: e.target.value }))} />
              </div>
              <div>
                <Label>Provider</Label>
                <Select value={draft.provider} onValueChange={(v) => setDraft((d) => ({ ...d, provider: v as ModelProvider }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
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
              <Plus className="h-4 w-4 mr-2" /> Add Model
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Provider API Keys</h3>
            <div className="space-y-3">
              {PROVIDERS.map((p) => (
                <div key={p.id} className="border rounded-lg p-3 space-y-2">
                  <div className="font-medium">{p.label}</div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label>API key (client)</Label>
                      <Input
                        placeholder="Stored locally in your browser"
                        value={providerAuth[p.id]?.apiKeyClient ?? ''}
                        onChange={(e) => setProviderAuth(p.id, { apiKeyClient: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Base URL</Label>
                      <Input
                        placeholder={p.id === 'ollama' ? 'http://127.0.0.1:11434' : 'Optional'}
                        value={providerAuth[p.id]?.baseUrl ?? ''}
                        onChange={(e) => setProviderAuth(p.id, { baseUrl: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Env var (server)</Label>
                      <Input disabled value={providerAuth[p.id]?.apiKeyEnv ?? ''} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              API keys entered here are stored locally in your browser for client-side requests. For server-side requests, set environment variables on the host.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
