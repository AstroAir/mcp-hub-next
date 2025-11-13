import { act } from "@testing-library/react";
import type { ModelConfig, ProviderAuthConfig } from "../types";

describe("useModelStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  async function initStore() {
    jest.resetModules();
    return (await import("./model-store")).useModelStore;
  }

  const mockModel: ModelConfig = {
    id: "test-model",
    label: "Test Model",
    provider: "anthropic",
    preset: false,
    defaultParams: {
      temperature: 0.7,
      maxTokens: 2048,
    },
  };

  describe("Model CRUD operations", () => {
    it("adds a model", async () => {
      const useModelStore = await initStore();

      const initialCount = useModelStore.getState().models.length;

      act(() => {
        useModelStore.getState().addModel(mockModel);
      });

      const state = useModelStore.getState();
      expect(state.models).toHaveLength(initialCount + 1);
      expect(state.models.find((m) => m.id === "test-model")).toEqual(mockModel);
    });

    it("updates a model", async () => {
      const useModelStore = await initStore();

      act(() => {
        useModelStore.getState().addModel(mockModel);
      });

      act(() => {
        useModelStore.getState().updateModel("test-model", { label: "Updated Model" });
      });

      const state = useModelStore.getState();
      const updatedModel = state.models.find((m) => m.id === "test-model");
      expect(updatedModel?.label).toBe("Updated Model");
    });

    it("removes a model", async () => {
      const useModelStore = await initStore();

      act(() => {
        useModelStore.getState().addModel(mockModel);
      });

      const beforeCount = useModelStore.getState().models.length;

      act(() => {
        useModelStore.getState().removeModel("test-model");
      });

      const state = useModelStore.getState();
      expect(state.models).toHaveLength(beforeCount - 1);
      expect(state.models.find((m) => m.id === "test-model")).toBeUndefined();
    });

    it("gets a model by id", async () => {
      const useModelStore = await initStore();

      act(() => {
        useModelStore.getState().addModel(mockModel);
      });

      const model = useModelStore.getState().getModel("test-model");
      expect(model).toEqual(mockModel);
    });

    it("returns undefined for non-existent model", async () => {
      const useModelStore = await initStore();

      const model = useModelStore.getState().getModel("non-existent");
      expect(model).toBeUndefined();
    });
  });

  describe("Model selection", () => {
    it("sets default model", async () => {
      const useModelStore = await initStore();

      act(() => {
        useModelStore.getState().addModel(mockModel);
      });

      act(() => {
        useModelStore.getState().setDefaultModel("test-model");
      });

      const state = useModelStore.getState();
      expect(state.defaultModelId).toBe("test-model");
    });

    it("clears default model", async () => {
      const useModelStore = await initStore();

      act(() => {
        useModelStore.getState().setDefaultModel(null);
      });

      const state = useModelStore.getState();
      expect(state.defaultModelId).toBeNull();
    });
  });

  describe("Provider filtering", () => {
    it("gets models by provider", async () => {
      const useModelStore = await initStore();

      act(() => {
        useModelStore.getState().addModel(mockModel);
        useModelStore.getState().addModel({
          ...mockModel,
          id: "openai-model",
          provider: "openai",
        });
      });

      const anthropicModels = useModelStore.getState().getModelsByProvider("anthropic");
      expect(anthropicModels.length).toBeGreaterThan(0);
      expect(anthropicModels.every((m) => m.provider === "anthropic")).toBe(true);
    });

    it("returns empty array for provider with no models", async () => {
      const useModelStore = await initStore();

      const models = useModelStore.getState().getModelsByProvider("other");
      expect(models).toHaveLength(0);
    });
  });

  describe("Provider authentication", () => {
    it("sets provider auth config", async () => {
      const useModelStore = await initStore();

      const authConfig: Partial<ProviderAuthConfig> = {
        apiKey: "test-api-key",
      };

      act(() => {
        useModelStore.getState().setProviderAuth("anthropic", authConfig);
      });

      const state = useModelStore.getState();
      expect(state.providerAuth.anthropic.apiKey).toBe("test-api-key");
    });

    it("updates existing provider auth", async () => {
      const useModelStore = await initStore();

      act(() => {
        useModelStore.getState().setProviderAuth("anthropic", { apiKey: "key1" });
      });

      act(() => {
        useModelStore.getState().setProviderAuth("anthropic", { apiKey: "key2" });
      });

      const state = useModelStore.getState();
      expect(state.providerAuth.anthropic.apiKey).toBe("key2");
    });
  });

  describe("Persistence", () => {
    it("saves models to localStorage", async () => {
      const useModelStore = await initStore();

      act(() => {
        useModelStore.getState().addModel(mockModel);
      });

      const saved = localStorage.getItem("mcp-model-configs");
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed.find((m: ModelConfig) => m.id === "test-model")).toBeDefined();
    });

    it("loads models from localStorage", async () => {
      const customModels = [mockModel];
      localStorage.setItem("mcp-model-configs", JSON.stringify(customModels));

      const useModelStore = await initStore();

      act(() => {
        useModelStore.getState().load();
      });

      const state = useModelStore.getState();
      expect(state.models.find((m) => m.id === "test-model")).toBeDefined();
    });

    it("saves provider auth to localStorage", async () => {
      const useModelStore = await initStore();

      act(() => {
        useModelStore.getState().setProviderAuth("anthropic", { apiKey: "test-key" });
      });

      const saved = localStorage.getItem("mcp-provider-auth");
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed.anthropic.apiKey).toBe("test-key");
    });

    it("handles invalid JSON in localStorage", async () => {
      localStorage.setItem("mcp-model-configs", "invalid json");

      const useModelStore = await initStore();

      act(() => {
        useModelStore.getState().load();
      });

      // Should fall back to default models
      const state = useModelStore.getState();
      expect(state.models.length).toBeGreaterThan(0);
    });
  });

  describe("Default models", () => {
    it("initializes with default models", async () => {
      const useModelStore = await initStore();

      const state = useModelStore.getState();
      expect(state.models.length).toBeGreaterThan(0);
      expect(state.models.some((m) => m.preset)).toBe(true);
    });

    it("has default provider auth configs", async () => {
      const useModelStore = await initStore();

      const state = useModelStore.getState();
      expect(state.providerAuth.anthropic).toBeDefined();
      expect(state.providerAuth.openai).toBeDefined();
      expect(state.providerAuth.google).toBeDefined();
    });
  });
});

