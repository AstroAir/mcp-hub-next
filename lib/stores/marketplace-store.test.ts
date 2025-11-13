import { act } from "@testing-library/react";
import type { MarketplaceMCPServer } from "../types";

// Mock the marketplace service
jest.mock("@/lib/services/marketplace", () => ({
  getMarketplaceServers: jest.fn(),
  extractCategories: jest.fn((servers) => ["category1", "category2"]),
  extractTags: jest.fn((servers) => ["tag1", "tag2"]),
  filterMarketplaceServers: jest.fn((servers) => servers),
  sortMarketplaceServers: jest.fn((servers) => servers),
}));

describe("useMarketplaceStore", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  async function initStore() {
    jest.resetModules();
    return (await import("./marketplace-store")).useMarketplaceStore;
  }

  const mockServer: MarketplaceMCPServer = {
    id: "test-server",
    name: "Test Server",
    description: "A test marketplace server",
    author: "Test Author",
    category: "Tools",
    tags: ["test", "example"],
    stars: 100,
    downloads: 1000,
    lastUpdated: "2024-01-01",
    version: "1.0.0",
    repository: "https://github.com/test/server",
    homepage: "https://example.com",
    license: "MIT",
  };

  describe("Server management", () => {
    it("sets servers", async () => {
      const useMarketplaceStore = await initStore();

      act(() => {
        useMarketplaceStore.getState().setServers([mockServer]);
      });

      const state = useMarketplaceStore.getState();
      expect(state.servers).toHaveLength(1);
      expect(state.servers[0]).toEqual(mockServer);
    });

    it("extracts categories and tags when setting servers", async () => {
      const useMarketplaceStore = await initStore();

      act(() => {
        useMarketplaceStore.getState().setServers([mockServer]);
      });

      const state = useMarketplaceStore.getState();
      expect(state.categories).toEqual(["category1", "category2"]);
      expect(state.allTags).toEqual(["tag1", "tag2"]);
    });

    it("sets filtered servers", async () => {
      const useMarketplaceStore = await initStore();

      act(() => {
        useMarketplaceStore.getState().setFilteredServers([mockServer]);
      });

      const state = useMarketplaceStore.getState();
      expect(state.filteredServers).toHaveLength(1);
    });
  });

  describe("Server selection", () => {
    it("sets selected server", async () => {
      const useMarketplaceStore = await initStore();

      act(() => {
        useMarketplaceStore.getState().setSelectedServer(mockServer);
      });

      const state = useMarketplaceStore.getState();
      expect(state.selectedServer).toEqual(mockServer);
    });

    it("clears selected server", async () => {
      const useMarketplaceStore = await initStore();

      act(() => {
        useMarketplaceStore.getState().setSelectedServer(mockServer);
      });

      act(() => {
        useMarketplaceStore.getState().setSelectedServer(null);
      });

      const state = useMarketplaceStore.getState();
      expect(state.selectedServer).toBeNull();
    });
  });

  describe("View mode", () => {
    it("sets view mode to card", async () => {
      const useMarketplaceStore = await initStore();

      act(() => {
        useMarketplaceStore.getState().setViewMode("card");
      });

      const state = useMarketplaceStore.getState();
      expect(state.viewMode).toBe("card");
    });

    it("sets view mode to list", async () => {
      const useMarketplaceStore = await initStore();

      act(() => {
        useMarketplaceStore.getState().setViewMode("list");
      });

      const state = useMarketplaceStore.getState();
      expect(state.viewMode).toBe("list");
    });
  });

  describe("Filters", () => {
    it("sets filters", async () => {
      const useMarketplaceStore = await initStore();

      act(() => {
        useMarketplaceStore.getState().setFilters({ search: "test" });
      });

      const state = useMarketplaceStore.getState();
      expect(state.filters.search).toBe("test");
    });

    it("merges filters", async () => {
      const useMarketplaceStore = await initStore();

      act(() => {
        useMarketplaceStore.getState().setFilters({ search: "test" });
      });

      act(() => {
        useMarketplaceStore.getState().setFilters({ category: "Tools" });
      });

      const state = useMarketplaceStore.getState();
      expect(state.filters.search).toBe("test");
      expect(state.filters.category).toBe("Tools");
    });

    it("resets filters", async () => {
      const useMarketplaceStore = await initStore();

      act(() => {
        useMarketplaceStore.getState().setFilters({ search: "test", category: "Tools" });
      });

      act(() => {
        useMarketplaceStore.getState().resetFilters();
      });

      const state = useMarketplaceStore.getState();
      expect(state.filters).toEqual({});
    });
  });

  describe("Loading state", () => {
    it("sets loading state", async () => {
      const useMarketplaceStore = await initStore();

      act(() => {
        useMarketplaceStore.getState().setLoading(true);
      });

      expect(useMarketplaceStore.getState().isLoading).toBe(true);

      act(() => {
        useMarketplaceStore.getState().setLoading(false);
      });

      expect(useMarketplaceStore.getState().isLoading).toBe(false);
    });
  });

  describe("Error state", () => {
    it("sets error", async () => {
      const useMarketplaceStore = await initStore();

      act(() => {
        useMarketplaceStore.getState().setError("Test error");
      });

      const state = useMarketplaceStore.getState();
      expect(state.error).toBe("Test error");
    });

    it("clears error", async () => {
      const useMarketplaceStore = await initStore();

      act(() => {
        useMarketplaceStore.getState().setError("Test error");
      });

      act(() => {
        useMarketplaceStore.getState().setError(null);
      });

      const state = useMarketplaceStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe("Last fetched timestamp", () => {
    it("sets last fetched timestamp", async () => {
      const useMarketplaceStore = await initStore();

      const now = new Date();

      act(() => {
        useMarketplaceStore.getState().setLastFetched(now);
      });

      const state = useMarketplaceStore.getState();
      expect(state.lastFetched).toEqual(now);
    });
  });

  describe("Initial state", () => {
    it("initializes with correct default values", async () => {
      const useMarketplaceStore = await initStore();

      const state = useMarketplaceStore.getState();
      expect(state.servers).toHaveLength(0);
      expect(state.filteredServers).toHaveLength(0);
      expect(state.selectedServer).toBeNull();
      expect(state.viewMode).toBe("card");
      expect(state.filters).toEqual({});
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastFetched).toBeNull();
      expect(state.categories).toHaveLength(0);
      expect(state.allTags).toHaveLength(0);
    });
  });
});

