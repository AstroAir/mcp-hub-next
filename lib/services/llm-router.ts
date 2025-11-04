import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage, ModelId, ModelConfig } from '@/lib/types';
import { useModelStore } from '@/lib/stores/model-store';

// Utility to access model store in server context: replicate logic from store loader
function getModelConfig(modelId: ModelId): ModelConfig | undefined {
  try {
    // Try store if available (client), else read from localStorage not available on server
    const store = useModelStore.getState?.();
    if (store) {
      return store.getModel(modelId);
    }
  } catch {}
  // Fallback minimal mapping for server without store
  const provider = inferProviderFromModelId(modelId);
  return { id: modelId, label: modelId, provider } as ModelConfig;
}

function inferProviderFromModelId(modelId: string): ModelConfig['provider'] {
  if (modelId.startsWith('claude')) return 'anthropic';
  if (modelId.startsWith('gpt-') || modelId.startsWith('o')) return 'openai';
  if (modelId.startsWith('gemini') || modelId.startsWith('models/')) return 'google';
  if (modelId.includes('llama') || modelId.includes(':')) return 'ollama';
  if (modelId.startsWith('mistral')) return 'mistral';
  return 'other';
}

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  tools?: unknown;
}

export interface CompletionResult {
  text: string;
}

export async function complete({ model, messages, options = {} }: { model: ModelId; messages: ChatMessage[]; options?: CompletionOptions; }): Promise<CompletionResult> {
  const cfg = getModelConfig(model);
  const provider = cfg?.provider || inferProviderFromModelId(model);

  switch (provider) {
    case 'anthropic': {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
      const resp = await anthropic.messages.create({
        model,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
        messages: messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        tools: options.tools as Anthropic.Tool[] | undefined,
      });
      const text = resp.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('\n');
      return { text };
    }
    case 'openai': {
      const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      const apiKey = process.env.OPENAI_API_KEY || '';
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1024,
        }),
      });
      if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? '';
      return { text };
    }
    case 'google': {
      const key = process.env.GOOGLE_API_KEY || '';
      const modelName = model.startsWith('models/') ? model : `models/${model}`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: messages.map((m) => ({ text: `${m.role}: ${m.content}` })),
            },
          ],
          generationConfig: { temperature: options.temperature ?? 0.7, maxOutputTokens: options.maxTokens ?? 1024 },
        }),
      });
      if (!res.ok) throw new Error(`Google GenAI error ${res.status}`);
      const data = (await res.json()) as Record<string, unknown>;
      const candidates = (data as { candidates?: unknown[] }).candidates;
      let text = '';
      if (Array.isArray(candidates) && candidates.length > 0) {
        const first = candidates[0] as { content?: { parts?: Array<{ text?: string }> } };
        const parts = first.content?.parts;
        if (Array.isArray(parts)) {
          text = parts.map((p) => p.text ?? '').join('\n');
        }
      }
      return { text };
    }
    case 'ollama': {
      const base = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
      const res = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          options: { temperature: options.temperature ?? 0.7, num_predict: options.maxTokens ?? 1024 },
        }),
      });
      if (!res.ok) throw new Error(`Ollama error ${res.status}`);
      const data = await res.json();
      const text = data.message?.content ?? '';
      return { text };
    }
    case 'mistral': {
      const apiKey = process.env.MISTRAL_API_KEY || '';
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1024,
        }),
      });
      if (!res.ok) throw new Error(`Mistral error ${res.status}`);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? '';
      return { text };
    }
    default: {
      throw new Error(`Provider not supported for model ${model}`);
    }
  }
}
