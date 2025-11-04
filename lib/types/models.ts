/**
 * Model configuration and provider types
 */

export type ModelProvider = 'anthropic' | 'openai' | 'google' | 'ollama' | 'mistral' | 'together' | 'azure-openai' | 'other';

export interface ModelParameters {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface ModelConfig {
  id: string; // Model id used by provider API
  label: string; // Human friendly label
  provider: ModelProvider;
  preset?: boolean; // preloaded default model
  endpoint?: string; // Custom endpoint for self-hosted or Azure
  apiKeyEnv?: string; // Environment variable name for API key resolution (server-side)
  apiKeyClient?: string; // Optional client-stored key (localStorage); not recommended for production
  defaultParams?: ModelParameters;
  // For Azure OpenAI
  azure?: {
    apiVersion?: string;
    deployment?: string; // deployment name if differs from id
  };
}

export interface ProviderAuthConfig {
  provider: ModelProvider;
  apiKeyEnv?: string; // server-side env var
  apiKeyClient?: string; // client-stored key
  baseUrl?: string; // custom base URL
}
