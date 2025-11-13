import { act } from "@testing-library/react";
import type { MCPConnectionState, MCPConnectionHistoryEntry } from "../types";

describe("useConnectionStore", () => {
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
    return (await import("./connection-store")).useConnectionStore;
  }

  const mockConnectionState: MCPConnectionState = {
    status: "connected",
    tools: [
      {
        name: "test_tool",
        description: "A test tool",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
    prompts: [],
    resources: [],
    connectedAt: new Date(now).toISOString(),
  };

  describe("Connection state management", () => {
    it("sets connection state", async () => {
      const useConnectionStore = await initStore();

      act(() => {
        useConnectionStore.getState().setConnectionState("server-1", mockConnectionState);
      });

      const state = useConnectionStore.getState();
      expect(state.connections["server-1"]).toEqual(mockConnectionState);
    });

    it("updates existing connection state", async () => {
      const useConnectionStore = await initStore();

      act(() => {
        useConnectionStore.getState().setConnectionState("server-1", mockConnectionState);
      });

      const updatedState: MCPConnectionState = {
        ...mockConnectionState,
        status: "disconnected",
      };

      act(() => {
        useConnectionStore.getState().setConnectionState("server-1", updatedState);
      });

      const state = useConnectionStore.getState();
      expect(state.connections["server-1"].status).toBe("disconnected");
    });

    it("removes connection", async () => {
      const useConnectionStore = await initStore();

      act(() => {
        useConnectionStore.getState().setConnectionState("server-1", mockConnectionState);
      });

      act(() => {
        useConnectionStore.getState().removeConnection("server-1");
      });

      const state = useConnectionStore.getState();
      expect(state.connections["server-1"]).toBeUndefined();
    });

    it("gets connection by server id", async () => {
      const useConnectionStore = await initStore();

      act(() => {
        useConnectionStore.getState().setConnectionState("server-1", mockConnectionState);
      });

      const connection = useConnectionStore.getState().getConnection("server-1");
      expect(connection).toEqual(mockConnectionState);
    });

    it("returns undefined for non-existent connection", async () => {
      const useConnectionStore = await initStore();

      const connection = useConnectionStore.getState().getConnection("non-existent");
      expect(connection).toBeUndefined();
    });
  });

  describe("Connection history", () => {
    const mockHistoryEntry: MCPConnectionHistoryEntry = {
      serverId: "server-1",
      serverName: "Test Server",
      timestamp: new Date(now).toISOString(),
      status: "connected",
      duration: 1000,
    };

    it("adds history entry", async () => {
      const useConnectionStore = await initStore();

      act(() => {
        useConnectionStore.getState().addHistoryEntry(mockHistoryEntry);
      });

      const state = useConnectionStore.getState();
      expect(state.history).toHaveLength(1);
      expect(state.history[0]).toEqual(mockHistoryEntry);
    });

    it("adds multiple history entries", async () => {
      const useConnectionStore = await initStore();

      act(() => {
        useConnectionStore.getState().addHistoryEntry(mockHistoryEntry);
        useConnectionStore.getState().addHistoryEntry({
          ...mockHistoryEntry,
          serverId: "server-2",
        });
      });

      const state = useConnectionStore.getState();
      expect(state.history).toHaveLength(2);
    });

    it("limits history to MAX_HISTORY_ENTRIES", async () => {
      const useConnectionStore = await initStore();

      // Add 101 entries (max is 100)
      act(() => {
        for (let i = 0; i < 101; i++) {
          useConnectionStore.getState().addHistoryEntry({
            ...mockHistoryEntry,
            serverId: `server-${i}`,
          });
        }
      });

      const state = useConnectionStore.getState();
      expect(state.history).toHaveLength(100);
    });

    it("clears history", async () => {
      const useConnectionStore = await initStore();

      act(() => {
        useConnectionStore.getState().addHistoryEntry(mockHistoryEntry);
      });

      act(() => {
        useConnectionStore.getState().clearHistory();
      });

      const state = useConnectionStore.getState();
      expect(state.history).toHaveLength(0);
    });
  });

  describe("Persistence", () => {
    const mockHistoryEntry: MCPConnectionHistoryEntry = {
      serverId: "server-1",
      serverName: "Test Server",
      timestamp: new Date(now).toISOString(),
      status: "connected",
      duration: 1000,
    };

    it("saves history to localStorage", async () => {
      const useConnectionStore = await initStore();

      act(() => {
        useConnectionStore.getState().addHistoryEntry(mockHistoryEntry);
      });

      const saved = localStorage.getItem("mcp-connection-history");
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].serverId).toBe("server-1");
    });

    it("loads history from localStorage", async () => {
      localStorage.setItem("mcp-connection-history", JSON.stringify([mockHistoryEntry]));

      const useConnectionStore = await initStore();

      act(() => {
        useConnectionStore.getState().loadHistory();
      });

      const state = useConnectionStore.getState();
      expect(state.history).toHaveLength(1);
      expect(state.history[0].serverId).toBe("server-1");
    });

    it("handles invalid JSON in localStorage", async () => {
      localStorage.setItem("mcp-connection-history", "invalid json");

      const useConnectionStore = await initStore();

      act(() => {
        useConnectionStore.getState().loadHistory();
      });

      const state = useConnectionStore.getState();
      expect(state.history).toHaveLength(0);
    });
  });

  describe("Multiple connections", () => {
    it("manages multiple connections simultaneously", async () => {
      const useConnectionStore = await initStore();

      act(() => {
        useConnectionStore.getState().setConnectionState("server-1", mockConnectionState);
        useConnectionStore.getState().setConnectionState("server-2", {
          ...mockConnectionState,
          status: "connecting",
        });
      });

      const state = useConnectionStore.getState();
      expect(Object.keys(state.connections)).toHaveLength(2);
      expect(state.connections["server-1"].status).toBe("connected");
      expect(state.connections["server-2"].status).toBe("connecting");
    });
  });
});

