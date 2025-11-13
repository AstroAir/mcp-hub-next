/**
 * Marketplace Test Fixtures
 * Mock data for marketplace server testing
 */

import type { MarketplaceMCPServer } from '@/lib/types';

/**
 * Create a mock marketplace server with default values
 */
export function createMockMarketplaceServer(
  overrides: Partial<MarketplaceMCPServer> = {}
): MarketplaceMCPServer {
  const defaults: MarketplaceMCPServer = {
    mcpId: 'github.com/test/server',
    githubUrl: 'https://github.com/test/server',
    name: 'Test Server',
    author: 'Test Author',
    description: 'A test marketplace server for testing purposes',
    codiconIcon: 'plug',
    logoUrl: 'https://example.com/logo.png',
    category: 'Development',
    tags: ['test', 'example'],
    requiresApiKey: false,
    readmeContent: '# Test Server\n\nThis is a test server.',
    isRecommended: false,
    githubStars: 100,
    downloadCount: 1000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    lastGithubSync: '2024-02-01T00:00:00Z',
  };

  return { ...defaults, ...overrides };
}

/**
 * Sample marketplace servers for testing
 */
export const mockMarketplaceServers: MarketplaceMCPServer[] = [
  createMockMarketplaceServer({
    mcpId: 'github.com/example/alpha',
    githubUrl: 'https://github.com/example/alpha',
    name: 'Alpha Server',
    author: 'Example Org',
    description: 'First test server for file operations',
    category: 'File Management',
    tags: ['files', 'storage', 'search'],
    requiresApiKey: false,
    isRecommended: true,
    githubStars: 500,
    downloadCount: 5000,
    updatedAt: '2024-03-01T00:00:00Z',
  }),
  createMockMarketplaceServer({
    mcpId: 'github.com/example/beta',
    githubUrl: 'https://github.com/example/beta',
    name: 'Beta Server',
    author: 'Beta Team',
    description: 'Second test server for API integrations',
    category: 'API',
    tags: ['api', 'integration', 'rest'],
    requiresApiKey: true,
    isRecommended: false,
    githubStars: 250,
    downloadCount: 2500,
    updatedAt: '2024-02-15T00:00:00Z',
  }),
  createMockMarketplaceServer({
    mcpId: 'github.com/example/gamma',
    githubUrl: 'https://github.com/example/gamma',
    name: 'Gamma Server',
    author: 'Gamma Inc',
    description: 'Third test server for database operations',
    category: 'Database',
    tags: ['database', 'sql', 'query'],
    requiresApiKey: false,
    isRecommended: true,
    githubStars: 750,
    downloadCount: 7500,
    updatedAt: '2024-03-15T00:00:00Z',
  }),
  createMockMarketplaceServer({
    mcpId: 'github.com/example/delta',
    githubUrl: 'https://github.com/example/delta',
    name: 'Delta Server',
    author: 'Delta Labs',
    description: 'Fourth test server for AI operations',
    category: 'AI',
    tags: ['ai', 'ml', 'nlp'],
    requiresApiKey: true,
    isRecommended: false,
    githubStars: 1000,
    downloadCount: 10000,
    updatedAt: '2024-01-15T00:00:00Z',
  }),
  createMockMarketplaceServer({
    mcpId: 'github.com/example/epsilon',
    githubUrl: 'https://github.com/example/epsilon',
    name: 'Epsilon Server',
    author: 'Example Org',
    description: 'Fifth test server for development tools',
    category: 'Development',
    tags: ['dev', 'tools', 'productivity'],
    requiresApiKey: false,
    isRecommended: false,
    githubStars: 150,
    downloadCount: 1500,
    updatedAt: '2024-02-28T00:00:00Z',
  }),
];

/**
 * Mock installation API responses
 */
export const mockInstallationResponses = {
  success: {
    success: true,
    data: {
      installId: 'test-install-id',
      progress: {
        installId: 'test-install-id',
        status: 'in_progress' as const,
        stage: 'downloading' as const,
        progress: 50,
        message: 'Downloading package...',
        logs: ['Starting installation...', 'Downloading package...'],
        startedAt: new Date().toISOString(),
      },
    },
  },
  error: {
    success: false,
    error: 'Installation failed',
  },
  parseError: {
    success: false,
    error: 'Failed to parse GitHub repository URL',
  },
};

/**
 * Mock installation progress states
 */
export const mockInstallationProgress = {
  inProgress: {
    installId: 'test-install-id',
    status: 'in_progress' as const,
    stage: 'downloading' as const,
    progress: 50,
    message: 'Downloading package...',
    logs: ['Starting installation...', 'Downloading package...'],
    startedAt: new Date().toISOString(),
  },
  completed: {
    installId: 'test-install-id',
    status: 'completed' as const,
    stage: 'completed' as const,
    progress: 100,
    message: 'Installation completed successfully',
    logs: ['Starting installation...', 'Downloading package...', 'Installation completed'],
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
  failed: {
    installId: 'test-install-id',
    status: 'failed' as const,
    stage: 'downloading' as const,
    progress: 30,
    message: 'Installation failed',
    error: 'Network error',
    logs: ['Starting installation...', 'Downloading package...', 'Error: Network error'],
    startedAt: new Date().toISOString(),
    failedAt: new Date().toISOString(),
  },
};

/**
 * Mock marketplace store state
 */
export const mockMarketplaceStoreState = {
  servers: mockMarketplaceServers,
  filteredServers: mockMarketplaceServers,
  selectedServer: null,
  viewMode: 'card' as const,
  filters: {},
  isLoading: false,
  error: null,
  lastFetched: null,
  categories: ['File Management', 'API', 'Database', 'AI', 'Development'],
  allTags: ['files', 'storage', 'search', 'api', 'integration', 'rest', 'database', 'sql', 'query', 'ai', 'ml', 'nlp', 'dev', 'tools', 'productivity'],
};

/**
 * Mock server store methods
 */
export const mockServerStoreMethods = {
  setInstallationProgress: jest.fn(),
  removeInstallation: jest.fn(),
  registerInstallationRequest: jest.fn(),
  getState: jest.fn(() => ({
    registerInstallationRequest: jest.fn(),
  })),
};

/**
 * Mock marketplace store methods
 */
export const mockMarketplaceStoreMethods = {
  setServers: jest.fn(),
  setFilteredServers: jest.fn(),
  setSelectedServer: jest.fn(),
  setViewMode: jest.fn(),
  setFilters: jest.fn(),
  resetFilters: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
  setLastFetched: jest.fn(),
  applyFilters: jest.fn(),
  fetchServers: jest.fn(),
  refreshServers: jest.fn(),
  getState: jest.fn(() => mockMarketplaceStoreState),
};

/**
 * Create a mock marketplace store hook
 */
export function createMockMarketplaceStore(overrides: Partial<typeof mockMarketplaceStoreState> = {}) {
  return {
    ...mockMarketplaceStoreState,
    ...mockMarketplaceStoreMethods,
    ...overrides,
  };
}

/**
 * Create a mock server store hook
 */
export function createMockServerStore(overrides = {}) {
  return {
    ...mockServerStoreMethods,
    ...overrides,
  };
}

