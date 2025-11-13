import { act } from "@testing-library/react";
import type { RegistryServerEntry } from "../types";

describe("useRegistryStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  async function initStore() {
    jest.resetModules();
    return (await import("./registry-store")).useRegistryStore;
  }

  const mockServer: RegistryServerEntry = {
    id: "test-server",
    name: "Test Server",
    description: "A test MCP server",
    author: "Test Author",
    homepage: "https://example.com",
    repository: "https://github.com/test/server",
    license: "MIT",
    tags: ["test", "example"],
    version: "1.0.0",
    installCommand: "npm install test-server",
  };

  describe("Server management", () => {
    it("sets servers", async () => {
      const useRegistryStore = await initStore();

      act(() => {
        useRegistryStore.getState().setServers([mockServer]);
      });

      const state = useRegistryStore.getState();
      expect(state.servers).toHaveLength(1);
      expect(state.servers[0]).toEqual(mockServer);
    });

    it("replaces existing servers", async () => {
      const useRegistryStore = await initStore();

      act(() => {
        useRegistryStore.getState().setServers([mockServer]);
      });

      const newServer = { ...mockServer, id: "new-server" };

      act(() => {
        useRegistryStore.getState().setServers([newServer]);
      });

      const state = useRegistryStore.getState();
      expect(state.servers).toHaveLength(1);
      expect(state.servers[0].id).toBe("new-server");
    });
  });

  describe("Search functionality", () => {
    it("sets search results", async () => {
      const useRegistryStore = await initStore();

      act(() => {
        useRegistryStore.getState().setSearchResults([mockServer]);
      });

      const state = useRegistryStore.getState();
      expect(state.searchResults).toHaveLength(1);
      expect(state.searchResults[0]).toEqual(mockServer);
    });

    it("sets searching state", async () => {
      const useRegistryStore = await initStore();

      act(() => {
        useRegistryStore.getState().setIsSearching(true);
      });

      expect(useRegistryStore.getState().isSearching).toBe(true);

      act(() => {
        useRegistryStore.getState().setIsSearching(false);
      });

      expect(useRegistryStore.getState().isSearching).toBe(false);
    });

    it("clears search", async () => {
      const useRegistryStore = await initStore();

      act(() => {
        useRegistryStore.getState().setSearchResults([mockServer]);
        useRegistryStore.getState().setIsSearching(true);
      });

      act(() => {
        useRegistryStore.getState().clearSearch();
      });

      const state = useRegistryStore.getState();
      expect(state.searchResults).toHaveLength(0);
      expect(state.isSearching).toBe(false);
    });
  });

  describe("Server selection", () => {
    it("sets selected server", async () => {
      const useRegistryStore = await initStore();

      act(() => {
        useRegistryStore.getState().setSelectedServer(mockServer);
      });

      const state = useRegistryStore.getState();
      expect(state.selectedServer).toEqual(mockServer);
    });

    it("clears selected server", async () => {
      const useRegistryStore = await initStore();

      act(() => {
        useRegistryStore.getState().setSelectedServer(mockServer);
      });

      act(() => {
        useRegistryStore.getState().setSelectedServer(null);
      });

      const state = useRegistryStore.getState();
      expect(state.selectedServer).toBeNull();
    });
  });

  describe("Categories", () => {
    it("sets categories", async () => {
      const useRegistryStore = await initStore();

      const categories = ["database", "api", "tools"];

      act(() => {
        useRegistryStore.getState().setCategories(categories);
      });

      const state = useRegistryStore.getState();
      expect(state.categories).toEqual(categories);
    });

    it("replaces existing categories", async () => {
      const useRegistryStore = await initStore();

      act(() => {
        useRegistryStore.getState().setCategories(["old"]);
      });

      act(() => {
        useRegistryStore.getState().setCategories(["new"]);
      });

      const state = useRegistryStore.getState();
      expect(state.categories).toEqual(["new"]);
    });
  });

  describe("Initial state", () => {
    it("initializes with empty state", async () => {
      const useRegistryStore = await initStore();

      const state = useRegistryStore.getState();
      expect(state.servers).toHaveLength(0);
      expect(state.searchResults).toHaveLength(0);
      expect(state.isSearching).toBe(false);
      expect(state.selectedServer).toBeNull();
      expect(state.categories).toHaveLength(0);
    });
  });
});

