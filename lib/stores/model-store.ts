/**
 * Model Store - Manage AI model configurations and provider auth
 */

import { create } from 'zustand';
import type { ModelConfig, ModelProvider, ProviderAuthConfig } from '@/lib/types';

const MODELS_KEY = 'mcp-model-configs';
const PROVIDERS_KEY = 'mcp-provider-auth';

export interface ModelStoreState {
  models: ModelConfig[];
  providerAuth: Record<ModelProvider, ProviderAuthConfig>;
  defaultModelId: string | null;

  // CRUD
  addModel: (cfg: ModelConfig) => void;
  updateModel: (id: string, patch: Partial<ModelConfig>) => void;
  removeModel: (id: string) => void;

  // Selection
  setDefaultModel: (id: string | null) => void;

  // Provider auth
  setProviderAuth: (provider: ModelProvider, auth: Partial<ProviderAuthConfig>) => void;

  // Helpers
  getModel: (id: string) => ModelConfig | undefined;
  getModelsByProvider: (provider: ModelProvider) => ModelConfig[];

  // Persistence
  load: () => void;
  save: () => void;
}

const DEFAULT_MODELS: ModelConfig[] = [
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'anthropic', preset: true, defaultParams: { temperature: 0.7, maxTokens: 4096 } },
  { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', provider: 'anthropic', preset: true, defaultParams: { temperature: 0.7, maxTokens: 4096 } },
  { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus', provider: 'anthropic', preset: true, defaultParams: { temperature: 0.7, maxTokens: 4096 } },
  { id: 'gpt-4o', label: 'OpenAI GPT-4o', provider: 'openai', preset: true, defaultParams: { temperature: 0.7, maxTokens: 4096 } },
  { id: 'gpt-4-turbo', label: 'OpenAI GPT-4 Turbo', provider: 'openai', preset: true, defaultParams: { temperature: 0.7, maxTokens: 4096 } },
  { id: 'gpt-3.5-turbo', label: 'OpenAI GPT-3.5 Turbo', provider: 'openai', preset: true, defaultParams: { temperature: 0.7, maxTokens: 2048 } },
  { id: 'gemini-1.5-pro', label: 'Google Gemini 1.5 Pro', provider: 'google', preset: true, defaultParams: { temperature: 0.7, maxTokens: 2048 } },
  { id: 'llama3.1:70b', label: 'Llama 3.1 70B (Ollama)', provider: 'ollama', preset: true, defaultParams: { temperature: 0.7, maxTokens: 2048 } },
  { id: 'mistral-large', label: 'Mistral Large', provider: 'mistral', preset: true, defaultParams: { temperature: 0.7, maxTokens: 2048 } },
];

const DEFAULT_PROVIDER_AUTH: Record<ModelProvider, ProviderAuthConfig> = {
  anthropic: { provider: 'anthropic', apiKeyEnv: 'ANTHROPIC_API_KEY' },
  openai: { provider: 'openai', apiKeyEnv: 'OPENAI_API_KEY' },
  google: { provider: 'google', apiKeyEnv: 'GOOGLE_API_KEY' },
  ollama: { provider: 'ollama', baseUrl: 'http://127.0.0.1:11434' },
  mistral: { provider: 'mistral', apiKeyEnv: 'MISTRAL_API_KEY' },
  together: { provider: 'together', apiKeyEnv: 'TOGETHER_API_KEY', baseUrl: 'https://api.together.xyz' },
  'azure-openai': { provider: 'azure-openai', apiKeyEnv: 'AZURE_OPENAI_API_KEY' },
  other: { provider: 'other' },
};

function loadState(): Pick<ModelStoreState, 'models' | 'providerAuth' | 'defaultModelId'> {
  if (typeof window === 'undefined') return { models: DEFAULT_MODELS, providerAuth: DEFAULT_PROVIDER_AUTH, defaultModelId: DEFAULT_MODELS[0]?.id || null };
  try {
    const modelsRaw = localStorage.getItem(MODELS_KEY);
    const providersRaw = localStorage.getItem(PROVIDERS_KEY);
    const defaultModelId = localStorage.getItem(MODELS_KEY + ':default') || DEFAULT_MODELS[0]?.id || null;
    return {
      models: modelsRaw ? JSON.parse(modelsRaw) : DEFAULT_MODELS,
      providerAuth: providersRaw ? JSON.parse(providersRaw) : DEFAULT_PROVIDER_AUTH,
      defaultModelId,
    };
  } catch (e) {
    console.error('Failed to load model store:', e);
    return { models: DEFAULT_MODELS, providerAuth: DEFAULT_PROVIDER_AUTH, defaultModelId: DEFAULT_MODELS[0]?.id || null };
  }
}

function saveState(state: Pick<ModelStoreState, 'models' | 'providerAuth' | 'defaultModelId'>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MODELS_KEY, JSON.stringify(state.models));
    localStorage.setItem(PROVIDERS_KEY, JSON.stringify(state.providerAuth));
    if (state.defaultModelId) localStorage.setItem(MODELS_KEY + ':default', state.defaultModelId);
  } catch (e) {
    console.error('Failed to save model store:', e);
  }
}

export const useModelStore = create<ModelStoreState>((set, get) => ({
  models: DEFAULT_MODELS,
  providerAuth: DEFAULT_PROVIDER_AUTH,
  defaultModelId: DEFAULT_MODELS[0]?.id || null,

  addModel: (cfg) => {
    set((s) => ({ models: [...s.models, cfg] }));
    get().save();
  },
  updateModel: (id, patch) => {
    set((s) => ({ models: s.models.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
    get().save();
  },
  removeModel: (id) => {
    set((s) => ({ models: s.models.filter((m) => m.id !== id) }));
    get().save();
  },
  setDefaultModel: (id) => {
    set({ defaultModelId: id });
    get().save();
  },
  setProviderAuth: (provider, auth) => {
    set((s) => ({ providerAuth: { ...s.providerAuth, [provider]: { ...(s.providerAuth[provider] || { provider }), provider, ...auth } } }));
    get().save();
  },
  getModel: (id) => get().models.find((m) => m.id === id),
  getModelsByProvider: (provider) => get().models.filter((m) => m.provider === provider),

  load: () => {
    const state = loadState();
    set(state);
  },
  save: () => saveState({ models: get().models, providerAuth: get().providerAuth, defaultModelId: get().defaultModelId }),
}));

// Initialize on client
if (typeof window !== 'undefined') {
  useModelStore.getState().load();
}
