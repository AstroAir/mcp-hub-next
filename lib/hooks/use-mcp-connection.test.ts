import { act, renderHook } from "@testing-library/react";
import type { MCPServerConfig, MCPConnectionState } from "../types";
import { useMCPConnection } from "./use-mcp-connection";

const originalFetch = global.fetch;
const mockFetch = jest.fn();

let storeState: {
  connections: Record<string, MCPConnectionState>;
  setConnectionState: jest.Mock;
  removeConnection: jest.Mock;
  addHistoryEntry: jest.Mock;
};

jest.mock("../stores", () => ({
  useConnectionStore: () => storeState,
}));

describe("useMCPConnection", () => {
  const config: MCPServerConfig = {
    id: "server-1",
    name: "Test Server",
    description: "A test server",
    transportType: "stdio",
    command: "node",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as unknown as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;

    storeState = {
      connections: {},
      setConnectionState: jest.fn(),
      removeConnection: jest.fn(),
      addHistoryEntry: jest.fn(),
    };
  });

  afterAll(() => {
    (globalThis as { fetch: typeof fetch }).fetch = originalFetch;
  });

  it("connects successfully and records history", async () => {
    const responseData: MCPConnectionState = {
      serverId: config.id,
      status: "connected",
      errorCount: 0,
      tools: [],
      resources: [],
      prompts: [],
    };

    mockFetch.mockResolvedValue({
      json: async () => ({ success: true, data: responseData }),
    });

    const { result } = renderHook(() => useMCPConnection());

    let outcome;
    await act(async () => {
      outcome = await result.current.connect(config);
    });
    expect(outcome).toEqual({ success: true, data: responseData });
    expect(storeState.setConnectionState).toHaveBeenNthCalledWith(
      1,
      config.id,
      expect.objectContaining({ status: "connecting" })
    );
    expect(storeState.setConnectionState).toHaveBeenNthCalledWith(2, config.id, responseData);
    expect(storeState.addHistoryEntry).toHaveBeenCalledWith(
      expect.objectContaining({ serverId: config.id, success: true })
    );
  });

  it("handles API errors when connecting", async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ success: false, error: "Failed" }),
    });

    const { result } = renderHook(() => useMCPConnection());

    let outcome;
    await act(async () => {
      outcome = await result.current.connect(config);
    });
    expect(outcome).toEqual({ success: false, error: "Failed" });
    expect(storeState.setConnectionState).toHaveBeenNthCalledWith(
      1,
      config.id,
      expect.objectContaining({ status: "connecting" })
    );
    expect(storeState.setConnectionState).toHaveBeenNthCalledWith(
      2,
      config.id,
      expect.objectContaining({ status: "error", lastError: "Failed" })
    );
    expect(storeState.addHistoryEntry).toHaveBeenCalledWith(
      expect.objectContaining({ serverId: config.id, success: false, error: "Failed" })
    );
  });

  it("handles network failures when connecting", async () => {
    mockFetch.mockRejectedValue(new Error("Network down"));

    const { result } = renderHook(() => useMCPConnection());

    let outcome;
    await act(async () => {
      outcome = await result.current.connect(config);
    });
    expect(outcome).toEqual({ success: false, error: "Network down" });
    expect(storeState.setConnectionState).toHaveBeenNthCalledWith(
      1,
      config.id,
      expect.objectContaining({ status: "connecting" })
    );
    expect(storeState.setConnectionState).toHaveBeenNthCalledWith(
      2,
      config.id,
      expect.objectContaining({ status: "error", lastError: "Network down" })
    );
    expect(storeState.addHistoryEntry).toHaveBeenCalledWith(
      expect.objectContaining({ serverId: config.id, success: false, error: "Network down" })
    );
  });

  it("disconnects successfully", async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useMCPConnection());

    let outcome;
    await act(async () => {
      outcome = await result.current.disconnect(config.id);
    });
    expect(outcome).toEqual({ success: true });
    expect(storeState.removeConnection).toHaveBeenCalledWith(config.id);
  });

  it("returns errors during disconnect failures", async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ success: false, error: "Cannot disconnect" }),
    });

    const { result } = renderHook(() => useMCPConnection());

    let outcome;
    await act(async () => {
      outcome = await result.current.disconnect(config.id);
    });
    expect(outcome).toEqual({ success: false, error: "Cannot disconnect" });
    expect(storeState.removeConnection).not.toHaveBeenCalled();
  });

  it("executes tools and returns results", async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ success: true, data: { output: "done" } }),
    });

    const { result } = renderHook(() => useMCPConnection());

    let outcome;
    await act(async () => {
      outcome = await result.current.executeTool(config.id, "tool", { value: 1 });
    });
    expect(outcome).toEqual({ success: true, data: { output: "done" } });
  });

  it("handles tool execution failures", async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ success: false, error: "Tool failed" }),
    });

    const { result } = renderHook(() => useMCPConnection());

    let outcome;
    await act(async () => {
      outcome = await result.current.executeTool(config.id, "tool", { value: 1 });
    });
    expect(outcome).toEqual({ success: false, error: "Tool failed" });
  });
});
