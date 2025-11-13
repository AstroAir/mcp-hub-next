import { act } from "@testing-library/react";
import type { MCPServerConfig, InstallationProgress, InstalledServerMetadata } from "../types";

describe("useServerStore", () => {
  const now = new Date("2024-01-01T00:00:00Z").getTime();

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    localStorage.clear();
  });

  async function initStore() {
    jest.resetModules();
    return (await import("./server-store")).useServerStore;
  }

  const mockServer: MCPServerConfig = {
    id: "server-1",
    name: "Test Server",
    transportType: "stdio",
    command: "node",
    args: ["server.js"],
    enabled: true,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  };

  describe("Server CRUD operations", () => {
    it("adds a server", async () => {
      const useServerStore = await initStore();

      act(() => {
        useServerStore.getState().addServer(mockServer);
      });

      const state = useServerStore.getState();
      expect(state.servers).toHaveLength(1);
      expect(state.servers[0]).toEqual(mockServer);
    });

    it("updates a server", async () => {
      const useServerStore = await initStore();

      act(() => {
        useServerStore.getState().addServer(mockServer);
      });

      act(() => {
        useServerStore.getState().updateServer("server-1", { name: "Updated Server" });
      });

      const state = useServerStore.getState();
      expect(state.servers[0].name).toBe("Updated Server");
      expect(state.servers[0].updatedAt).toBeTruthy();
    });

    it("removes a server", async () => {
      const useServerStore = await initStore();

      act(() => {
        useServerStore.getState().addServer(mockServer);
      });

      act(() => {
        useServerStore.getState().removeServer("server-1");
      });

      const state = useServerStore.getState();
      expect(state.servers).toHaveLength(0);
    });

    it("gets a server by id", async () => {
      const useServerStore = await initStore();

      act(() => {
        useServerStore.getState().addServer(mockServer);
      });

      const server = useServerStore.getState().getServer("server-1");
      expect(server).toEqual(mockServer);
    });

    it("returns undefined for non-existent server", async () => {
      const useServerStore = await initStore();

      const server = useServerStore.getState().getServer("non-existent");
      expect(server).toBeUndefined();
    });
  });

  describe("Server enable/disable", () => {
    it("enables a server", async () => {
      const useServerStore = await initStore();

      act(() => {
        useServerStore.getState().addServer({ ...mockServer, enabled: false });
      });

      act(() => {
        useServerStore.getState().setServerEnabled("server-1", true);
      });

      const state = useServerStore.getState();
      expect(state.servers[0].enabled).toBe(true);
    });

    it("disables a server", async () => {
      const useServerStore = await initStore();

      act(() => {
        useServerStore.getState().addServer(mockServer);
      });

      act(() => {
        useServerStore.getState().setServerEnabled("server-1", false);
      });

      const state = useServerStore.getState();
      expect(state.servers[0].enabled).toBe(false);
    });
  });

  describe("Installation tracking", () => {
    it("sets installation progress", async () => {
      const useServerStore = await initStore();

      const progress: InstallationProgress = {
        status: "installing",
        progress: 50,
        message: "Installing dependencies...",
      };

      act(() => {
        useServerStore.getState().setInstallationProgress("server-1", progress);
      });

      const state = useServerStore.getState();
      expect(state.installations["server-1"]).toEqual(progress);
    });

    it("removes installation progress", async () => {
      const useServerStore = await initStore();

      const progress: InstallationProgress = {
        status: "installing",
        progress: 50,
        message: "Installing...",
      };

      act(() => {
        useServerStore.getState().setInstallationProgress("server-1", progress);
      });

      act(() => {
        useServerStore.getState().removeInstallation("server-1");
      });

      const state = useServerStore.getState();
      expect(state.installations["server-1"]).toBeUndefined();
    });
  });

  describe("Installed servers metadata", () => {
    it("adds installed server metadata", async () => {
      const useServerStore = await initStore();

      const metadata: InstalledServerMetadata = {
        serverId: "server-1",
        installedAt: new Date(now).toISOString(),
        version: "1.0.0",
        installPath: "/path/to/server",
      };

      act(() => {
        useServerStore.getState().addInstalledServer(metadata);
      });

      const state = useServerStore.getState();
      expect(state.installedServers["server-1"]).toEqual(metadata);
    });

    it("removes installed server metadata", async () => {
      const useServerStore = await initStore();

      const metadata: InstalledServerMetadata = {
        serverId: "server-1",
        installedAt: new Date(now).toISOString(),
        version: "1.0.0",
        installPath: "/path/to/server",
      };

      act(() => {
        useServerStore.getState().addInstalledServer(metadata);
      });

      act(() => {
        useServerStore.getState().removeInstalledServer("server-1");
      });

      const state = useServerStore.getState();
      expect(state.installedServers["server-1"]).toBeUndefined();
    });
  });

  describe("Persistence", () => {
    it("saves servers to localStorage", async () => {
      const useServerStore = await initStore();

      act(() => {
        useServerStore.getState().addServer(mockServer);
      });

      const saved = localStorage.getItem("mcp-servers");
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe("server-1");
    });

    it("loads servers from localStorage", async () => {
      localStorage.setItem("mcp-servers", JSON.stringify([mockServer]));

      const useServerStore = await initStore();

      act(() => {
        useServerStore.getState().loadServers();
      });

      const state = useServerStore.getState();
      expect(state.servers).toHaveLength(1);
      expect(state.servers[0].id).toBe("server-1");
    });

    it("handles invalid JSON in localStorage", async () => {
      localStorage.setItem("mcp-servers", "invalid json");

      const useServerStore = await initStore();

      act(() => {
        useServerStore.getState().loadServers();
      });

      const state = useServerStore.getState();
      expect(state.servers).toHaveLength(0);
    });
  });


});

