import type { MarketplaceMCPServer } from "../types";
import {
  cacheMarketplaceServers,
  clearMarketplaceCache,
  extractCategories,
  extractTags,
  fetchMarketplaceServers,
  filterMarketplaceServers,
  getCachedMarketplaceServers,
  getMarketplaceServers,
  sortMarketplaceServers,
} from "./marketplace";

const sampleServers: MarketplaceMCPServer[] = [
  {
    mcpId: "server-1",
    githubUrl: "https://github.com/example/server-1",
    name: "Alpha",
    author: "Example",
    description: "First server",
    codiconIcon: "plug",
    logoUrl: "https://example.com/logo1.png",
    category: "File",
    tags: ["files", "search"],
    requiresApiKey: false,
    readmeContent: "# Alpha",
    isRecommended: true,
    githubStars: 120,
    downloadCount: 2400,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
    lastGithubSync: "2024-02-01T00:00:00Z",
  },
  {
    mcpId: "server-2",
    githubUrl: "https://github.com/example/server-2",
    name: "Beta",
    author: "Example",
    description: "Second server",
    codiconIcon: "plug",
    logoUrl: "https://example.com/logo2.png",
    category: "Automation",
    tags: ["automation", "workflow"],
    requiresApiKey: true,
    readmeContent: "# Beta",
    isRecommended: false,
    githubStars: 80,
    downloadCount: 1200,
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-02-02T00:00:00Z",
    lastGithubSync: "2024-02-02T00:00:00Z",
  },
];

describe("marketplace service", () => {
  const originalFetch = global.fetch;
  const mockFetch = jest.fn();
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as unknown as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
    localStorage.clear();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    localStorage.clear();
  });

  afterAll(() => {
    (globalThis as { fetch: typeof fetch }).fetch = originalFetch;
  });

  it("fetches marketplace servers successfully", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ success: true, data: sampleServers }),
    });

    const servers = await fetchMarketplaceServers();
    expect(mockFetch).toHaveBeenCalledWith("/api/marketplace", expect.any(Object));
    expect(servers).toEqual(sampleServers);
  });

  it("throws when API response is not ok", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
    });

    await expect(fetchMarketplaceServers()).rejects.toThrow("Failed to fetch marketplace data: 500 Server Error");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("throws when API payload indicates failure", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ success: false, error: "Bad payload" }),
    });

    await expect(fetchMarketplaceServers()).rejects.toThrow("Bad payload");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("returns null when cache is empty", () => {
    expect(getCachedMarketplaceServers()).toBeNull();
  });

  it("returns cached marketplace data when fresh", () => {
    cacheMarketplaceServers(sampleServers);
    const timestamp = Date.now().toString();
    localStorage.setItem("mcp-marketplace-cache-timestamp", timestamp);

    expect(getCachedMarketplaceServers()).toEqual(sampleServers);
  });

  it("clears cache when data is expired", () => {
    cacheMarketplaceServers(sampleServers);
    const stale = Date.now() - 3_600_001;
    localStorage.setItem("mcp-marketplace-cache-timestamp", stale.toString());

    expect(getCachedMarketplaceServers()).toBeNull();
    expect(localStorage.getItem("mcp-marketplace-cache")).toBeNull();
    expect(localStorage.getItem("mcp-marketplace-cache-timestamp")).toBeNull();
  });

  it("persists cache entries and clears them explicitly", () => {
    cacheMarketplaceServers(sampleServers);
    expect(localStorage.getItem("mcp-marketplace-cache")).not.toBeNull();

    clearMarketplaceCache();
    expect(localStorage.getItem("mcp-marketplace-cache")).toBeNull();
    expect(localStorage.getItem("mcp-marketplace-cache-timestamp")).toBeNull();
  });

  it("uses cached data when available without force refresh", async () => {
    cacheMarketplaceServers(sampleServers);
    localStorage.setItem("mcp-marketplace-cache-timestamp", Date.now().toString());

    const servers = await getMarketplaceServers();
    expect(servers).toEqual(sampleServers);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches and caches when no cache is present", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ success: true, data: sampleServers }),
    });

    const servers = await getMarketplaceServers(true);
    expect(mockFetch).toHaveBeenCalledWith("/api/marketplace?refresh=true", expect.any(Object));
    expect(servers).toEqual(sampleServers);
    expect(localStorage.getItem("mcp-marketplace-cache")).not.toBeNull();
  });

  it("extracts sorted categories", () => {
    expect(extractCategories(sampleServers)).toEqual(["Automation", "File"]);
  });

  it("extracts sorted tags", () => {
    expect(extractTags(sampleServers)).toEqual(["automation", "files", "search", "workflow"]);
  });

  it("filters marketplace servers by query and flags", () => {
    const filtered = filterMarketplaceServers(sampleServers, {
      query: "alpha",
      category: "File",
      tags: ["files"],
      requiresApiKey: false,
      isRecommended: true,
    });

    expect(filtered).toEqual([sampleServers[0]]);
  });

  it("sorts marketplace servers by different criteria", () => {
    const byStars = sortMarketplaceServers(sampleServers, "stars");
    expect(byStars[0]).toBe(sampleServers[0]);

    const byDownloads = sortMarketplaceServers(sampleServers, "downloads");
    expect(byDownloads[0]).toBe(sampleServers[0]);

    const byUpdated = sortMarketplaceServers(sampleServers, "updated");
    expect(byUpdated[0]).toBe(sampleServers[1]);

    const byName = sortMarketplaceServers(sampleServers, "name");
    expect(byName[0]).toBe(sampleServers[0]);
  });
});
