import { act, renderHook } from "@testing-library/react";
import type { MCPServerConfig } from "../types";
import { useHealthMonitor } from "./use-health-monitor";

describe("useHealthMonitor", () => {
  const serverConfig: MCPServerConfig = {
    id: "server-1",
    name: "Server One",
    description: "Test server",
    transportType: "stdio",
    command: "node",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("exposes stable health map access", () => {
    const { result } = renderHook(() => useHealthMonitor());
  expect(result.current.healthStatuses).toBeInstanceOf(Map);
  expect(result.current.getHealth("missing")).toBeUndefined();
  });

  it("logs when attempting to monitor on the client", async () => {
    const { result } = renderHook(() => useHealthMonitor());

    act(() => {
      result.current.startMonitoring(serverConfig);
      result.current.updateConfig({ checkInterval: 1000 });
    });

    await act(async () => {
      await result.current.manualReconnect(serverConfig);
    });

    result.current.stopMonitoring(serverConfig.id);

    expect(warnSpy).toHaveBeenCalled();
  });

  it("keeps health map empty after configuration updates", () => {
    const { result } = renderHook(() => useHealthMonitor());

    act(() => {
      result.current.updateConfig({ timeout: 5000 });
    });

    expect(result.current.getHealth("server-1")).toBeUndefined();
  });
});
