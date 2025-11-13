import { act } from "@testing-library/react";
import type { MCPServerProcess } from "../types";

describe("useLifecycleStore", () => {
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
    return (await import("./lifecycle-store")).useLifecycleStore;
  }

  const mockProcess: MCPServerProcess = {
    serverId: "server-1",
    state: "running",
    pid: 12345,
    startedAt: new Date(now).toISOString(),
  };

  describe("Process management", () => {
    it("sets a process", async () => {
      const useLifecycleStore = await initStore();

      act(() => {
        useLifecycleStore.getState().setProcess("server-1", mockProcess);
      });

      const state = useLifecycleStore.getState();
      expect(state.processes["server-1"]).toEqual(mockProcess);
    });

    it("updates process state", async () => {
      const useLifecycleStore = await initStore();

      act(() => {
        useLifecycleStore.getState().setProcess("server-1", mockProcess);
      });

      act(() => {
        useLifecycleStore.getState().updateProcessState("server-1", { state: "stopped" });
      });

      const state = useLifecycleStore.getState();
      expect(state.processes["server-1"].state).toBe("stopped");
    });

    it("removes a process", async () => {
      const useLifecycleStore = await initStore();

      act(() => {
        useLifecycleStore.getState().setProcess("server-1", mockProcess);
      });

      act(() => {
        useLifecycleStore.getState().removeProcess("server-1");
      });

      const state = useLifecycleStore.getState();
      expect(state.processes["server-1"]).toBeUndefined();
    });

    it("gets a process by server id", async () => {
      const useLifecycleStore = await initStore();

      act(() => {
        useLifecycleStore.getState().setProcess("server-1", mockProcess);
      });

      const process = useLifecycleStore.getState().getProcess("server-1");
      expect(process).toEqual(mockProcess);
    });

    it("returns undefined for non-existent process", async () => {
      const useLifecycleStore = await initStore();

      const process = useLifecycleStore.getState().getProcess("non-existent");
      expect(process).toBeUndefined();
    });
  });

  describe("Running processes", () => {
    it("gets all running processes", async () => {
      const useLifecycleStore = await initStore();

      act(() => {
        useLifecycleStore.getState().setProcess("server-1", mockProcess);
        useLifecycleStore.getState().setProcess("server-2", {
          ...mockProcess,
          serverId: "server-2",
          state: "stopped",
        });
        useLifecycleStore.getState().setProcess("server-3", {
          ...mockProcess,
          serverId: "server-3",
          state: "running",
        });
      });

      const runningProcesses = useLifecycleStore.getState().getRunningProcesses();
      expect(runningProcesses).toHaveLength(2);
      expect(runningProcesses.every((p) => p.state === "running")).toBe(true);
    });

    it("returns empty array when no processes are running", async () => {
      const useLifecycleStore = await initStore();

      act(() => {
        useLifecycleStore.getState().setProcess("server-1", {
          ...mockProcess,
          state: "stopped",
        });
      });

      const runningProcesses = useLifecycleStore.getState().getRunningProcesses();
      expect(runningProcesses).toHaveLength(0);
    });
  });

  describe("Persistence", () => {
    it("saves processes to localStorage", async () => {
      const useLifecycleStore = await initStore();

      act(() => {
        useLifecycleStore.getState().setProcess("server-1", mockProcess);
      });

      const saved = localStorage.getItem("mcp-processes");
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed["server-1"]).toBeDefined();
      expect(parsed["server-1"].serverId).toBe("server-1");
    });

    it("loads processes from localStorage", async () => {
      localStorage.setItem("mcp-processes", JSON.stringify({ "server-1": mockProcess }));

      const useLifecycleStore = await initStore();

      act(() => {
        useLifecycleStore.getState().loadProcesses();
      });

      const state = useLifecycleStore.getState();
      expect(state.processes["server-1"]).toBeDefined();
      expect(state.processes["server-1"].serverId).toBe("server-1");
    });

    it("handles invalid JSON in localStorage", async () => {
      localStorage.setItem("mcp-processes", "invalid json");

      const useLifecycleStore = await initStore();

      act(() => {
        useLifecycleStore.getState().loadProcesses();
      });

      const state = useLifecycleStore.getState();
      expect(Object.keys(state.processes)).toHaveLength(0);
    });
  });

  describe("Multiple processes", () => {
    it("manages multiple processes simultaneously", async () => {
      const useLifecycleStore = await initStore();

      act(() => {
        useLifecycleStore.getState().setProcess("server-1", mockProcess);
        useLifecycleStore.getState().setProcess("server-2", {
          ...mockProcess,
          serverId: "server-2",
          state: "starting",
        });
      });

      const state = useLifecycleStore.getState();
      expect(Object.keys(state.processes)).toHaveLength(2);
      expect(state.processes["server-1"].state).toBe("running");
      expect(state.processes["server-2"].state).toBe("starting");
    });
  });
});

