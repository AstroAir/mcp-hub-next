import { jest } from "@jest/globals";

const execMock = jest.fn();

jest.mock("child_process", () => ({
  exec: (...args: unknown[]) => execMock(...args),
}));

describe("mcp-registry service", () => {
  const defaultPackages = [
    {
      name: "@modelcontextprotocol/server-filesystem",
      description: "Official filesystem server",
      version: "1.2.3",
      author: { name: "MCP" },
      links: { homepage: "https://example.com/fs", repository: "https://github.com/mcp/fs" },
      date: "2024-02-01T00:00:00Z",
      keywords: ["mcp", "filesystem"],
    },
    {
      name: "community-mcp-weather",
      description: "Weather insights",
      version: "0.5.0",
      author: { name: "Community" },
      links: { homepage: "https://example.com/weather" },
      date: "2024-02-10T00:00:00Z",
      keywords: ["weather", "mcp"],
    },
    {
      name: "irrelevant-package",
      description: "Should be filtered",
      version: "0.1.0",
      keywords: ["other"],
    },
  ];

  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    execMock.mockReset();
    execMock.mockImplementation((command: unknown, options: unknown, callback: unknown) => {
      const cb = (typeof options === "function" ? options : callback) as ((err: unknown, stdout: string, stderr: string) => void) | undefined;
      cb?.(null, JSON.stringify(defaultPackages), "");
    });
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  async function loadRegistry() {
    return import("./mcp-registry");
  }

  it("returns verified entries first when searching registry", async () => {
    const { searchRegistry } = await loadRegistry();

    const { servers, total } = await searchRegistry({ limit: 50 });
    expect(total).toBeGreaterThan(0);
    expect(servers[0]?.verified).toBe(true);
    expect(servers.map((server) => server.id)).toContain("@modelcontextprotocol/server-filesystem");
    expect(execMock).toHaveBeenCalledTimes(1);
  });

  it("applies query filters", async () => {
    const { searchRegistry } = await loadRegistry();

    const { servers } = await searchRegistry({ query: "filesystem" });
    const ids = servers.map((server) => server.id);
    expect(ids).toContain("@modelcontextprotocol/server-filesystem");
  });

  it("returns cached server by id", async () => {
    const { searchRegistry, getServerById } = await loadRegistry();

    await searchRegistry({ limit: 10 });
    const server = await getServerById("@modelcontextprotocol/server-filesystem");
    expect(server).not.toBeNull();
    expect(server?.verified).toBe(true);
  });

  it("collects category tags from cached servers", async () => {
    const { searchRegistry, getCategories } = await loadRegistry();

    await searchRegistry({ limit: 10 });
  const categories = await getCategories();
  expect(categories).toContain("filesystem");
  expect(categories).toContain("official");
  });

  it("returns paginated popular servers per source", async () => {
    const { searchRegistry, getPopularServers } = await loadRegistry();

    await searchRegistry({ limit: 50 });
    const popular = await getPopularServers(1, "npm");
    expect(popular).toHaveLength(1);
    expect(popular[0]?.source).toBe("npm");
  });

  it("refreshes and clears cache", async () => {
    const { searchRegistry, refreshCache, clearCache } = await loadRegistry();

    await searchRegistry({ limit: 10 });
    await refreshCache();
    expect(execMock).toHaveBeenCalledTimes(2);

    clearCache();
    await searchRegistry({ limit: 10 });
    expect(execMock).toHaveBeenCalledTimes(3);
  });
});
