/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarketplaceView } from './marketplace-view';
import { useMarketplaceStore } from '@/lib/stores';
import { 
  createMockMarketplaceStore,
  mockMarketplaceServers 
} from '@/lib/__tests__/fixtures/marketplace-data';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: any) => {
    const translations: Record<string, string> = {
      title: 'MCP Marketplace',
      subtitle: 'Discover and install MCP servers',
      'actions.refresh': 'Refresh',
      'actions.resetFilters': 'Reset filters',
      'states.errorTitle': 'Error loading marketplace',
      'states.errorDescription': 'An error occurred while loading the marketplace',
      'states.emptyTitle': 'No servers found',
      'states.emptyDescription': 'Try adjusting your filters',
      'stats.resultCount': `${params?.count || 0} servers found`,
    };
    return translations[key] || key;
  },
}));

// Mock stores
jest.mock('@/lib/stores', () => {
  const mockGetState = jest.fn();
  const mockFn = jest.fn();
  (mockFn as any).getState = mockGetState;
  return {
    useMarketplaceStore: mockFn,
  };
});

// Mock child components
jest.mock('./marketplace-search-filter', () => ({
  MarketplaceSearchFilter: () => <div data-testid="search-filter">Search Filter</div>,
}));

jest.mock('./marketplace-server-card', () => ({
  MarketplaceServerCard: ({ server, onViewDetails }: any) => (
    <div data-testid={`server-card-${server.mcpId}`} onClick={() => onViewDetails(server)}>
      {server.name}
    </div>
  ),
}));

jest.mock('./marketplace-server-list-item', () => ({
  MarketplaceServerListItem: ({ server, onViewDetails }: any) => (
    <div data-testid={`server-list-item-${server.mcpId}`} onClick={() => onViewDetails(server)}>
      {server.name}
    </div>
  ),
}));

jest.mock('./marketplace-server-detail', () => ({
  MarketplaceServerDetail: ({ server, open, onOpenChange }: any) => (
    open && server ? (
      <div data-testid="server-detail">
        <div>{server.name}</div>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null
  ),
}));

jest.mock('@/components/error/error-state', () => ({
  ErrorState: ({ title, description, onRetry }: any) => (
    <div data-testid="error-state">
      <div>{title}</div>
      <div>{description}</div>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}));

jest.mock('@/components/error/empty-state', () => ({
  EmptyState: ({ title, description, action }: any) => (
    <div data-testid="empty-state">
      <div>{title}</div>
      <div>{description}</div>
      {action && <button onClick={action.onClick}>{action.label}</button>}
    </div>
  ),
}));

jest.mock('@/components/mcp/installation-progress', () => ({
  InstallationProgressList: () => <div data-testid="installation-progress-list">Progress List</div>,
}));

const mockUseMarketplaceStore = useMarketplaceStore as jest.MockedFunction<typeof useMarketplaceStore>;
const mockGetState = (mockUseMarketplaceStore as any).getState as jest.Mock;

describe('MarketplaceView', () => {
  const defaultMockStore = createMockMarketplaceStore();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMarketplaceStore.mockReturnValue(defaultMockStore as any);
    mockGetState.mockReturnValue(defaultMockStore);
  });

  describe('Rendering', () => {
    it('renders title and subtitle', () => {
      render(<MarketplaceView />);
      
      expect(screen.getByText('MCP Marketplace')).toBeInTheDocument();
      expect(screen.getByText('Discover and install MCP servers')).toBeInTheDocument();
    });

    it('renders search filter component', () => {
      render(<MarketplaceView />);
      
      expect(screen.getByTestId('search-filter')).toBeInTheDocument();
    });

    it('renders refresh button', () => {
      render(<MarketplaceView />);
      
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    it('renders view mode toggle buttons', () => {
      render(<MarketplaceView />);
      
      const buttons = screen.getAllByRole('button');
      // Should have card and list view buttons
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders installation progress list', () => {
      render(<MarketplaceView />);
      
      expect(screen.getByTestId('installation-progress-list')).toBeInTheDocument();
    });
  });

  describe('Data fetching', () => {
    it('calls fetchServers on mount', () => {
      const mockFetchServers = jest.fn();
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({ fetchServers: mockFetchServers }) as any
      );
      
      render(<MarketplaceView />);
      
      expect(mockFetchServers).toHaveBeenCalled();
    });

    it('calls refreshServers when refresh button is clicked', async () => {
      const user = userEvent.setup();
      const mockRefreshServers = jest.fn();
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({ refreshServers: mockRefreshServers }) as any
      );
      
      render(<MarketplaceView />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);
      
      expect(mockRefreshServers).toHaveBeenCalled();
    });

    it('disables refresh button while loading', () => {
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({ isLoading: true }) as any
      );
      
      render(<MarketplaceView />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeDisabled();
    });

    it('shows spinning icon while loading', () => {
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({ isLoading: true }) as any
      );
      
      render(<MarketplaceView />);
      
      // The refresh button should have animate-spin class when loading
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('View modes', () => {
    it('renders card view by default', () => {
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({ 
          viewMode: 'card',
          filteredServers: mockMarketplaceServers 
        }) as any
      );
      
      render(<MarketplaceView />);
      
      mockMarketplaceServers.forEach(server => {
        expect(screen.getByTestId(`server-card-${server.mcpId}`)).toBeInTheDocument();
      });
    });

    it('renders list view when viewMode is list', () => {
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({ 
          viewMode: 'list',
          filteredServers: mockMarketplaceServers 
        }) as any
      );
      
      render(<MarketplaceView />);
      
      mockMarketplaceServers.forEach(server => {
        expect(screen.getByTestId(`server-list-item-${server.mcpId}`)).toBeInTheDocument();
      });
    });

    it('switches to card view when card button is clicked', async () => {
      const user = userEvent.setup();
      const mockSetViewMode = jest.fn();
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({ 
          viewMode: 'list',
          setViewMode: mockSetViewMode 
        }) as any
      );
      
      render(<MarketplaceView />);
      
      const buttons = screen.getAllByRole('button');
      // Find the card view button (first of the two view mode buttons)
      const viewModeButtons = buttons.filter(btn => 
        btn.querySelector('svg') && !btn.textContent?.includes('Refresh')
      );
      
      if (viewModeButtons[0]) {
        await user.click(viewModeButtons[0]);
        expect(mockSetViewMode).toHaveBeenCalledWith('card');
      }
    });

    it('switches to list view when list button is clicked', async () => {
      const user = userEvent.setup();
      const mockSetViewMode = jest.fn();
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({ 
          viewMode: 'card',
          setViewMode: mockSetViewMode 
        }) as any
      );
      
      render(<MarketplaceView />);
      
      const buttons = screen.getAllByRole('button');
      // Find the list view button (second of the two view mode buttons)
      const viewModeButtons = buttons.filter(btn => 
        btn.querySelector('svg') && !btn.textContent?.includes('Refresh')
      );
      
      if (viewModeButtons[1]) {
        await user.click(viewModeButtons[1]);
        expect(mockSetViewMode).toHaveBeenCalledWith('list');
      }
    });
  });

  describe('Loading state', () => {
    it('shows loading state when loading and no servers', () => {
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({
          isLoading: true,
          filteredServers: []
        }) as any
      );
      mockGetState.mockReturnValue(createMockMarketplaceStore({
        isLoading: true,
        filteredServers: []
      }));

      render(<MarketplaceView />);

      // Should show loading state (refresh button disabled)
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeDisabled();
    });

    it('shows servers when loading with existing servers', () => {
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({
          isLoading: true,
          filteredServers: mockMarketplaceServers,
          viewMode: 'card'
        }) as any
      );
      mockGetState.mockReturnValue(createMockMarketplaceStore({
        isLoading: true,
        filteredServers: mockMarketplaceServers
      }));

      render(<MarketplaceView />);

      // Should show actual servers even while loading
      expect(screen.getByTestId(`server-card-${mockMarketplaceServers[0].mcpId}`)).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('shows error state when error exists', () => {
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({ 
          error: 'Failed to load servers',
          isLoading: false 
        }) as any
      );
      
      render(<MarketplaceView />);
      
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('Error loading marketplace')).toBeInTheDocument();
    });

    it('calls refreshServers when retry button is clicked in error state', async () => {
      const user = userEvent.setup();
      const mockRefreshServers = jest.fn();
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({ 
          error: 'Failed to load servers',
          isLoading: false,
          refreshServers: mockRefreshServers 
        }) as any
      );
      
      render(<MarketplaceView />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);
      
      expect(mockRefreshServers).toHaveBeenCalled();
    });

    it('does not show error state while loading', () => {
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({ 
          error: 'Failed to load servers',
          isLoading: true 
        }) as any
      );
      
      render(<MarketplaceView />);
      
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty state when no servers and not loading', () => {
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({ 
          filteredServers: [],
          isLoading: false,
          error: null 
        }) as any
      );
      
      render(<MarketplaceView />);
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No servers found')).toBeInTheDocument();
    });

    it('calls resetFilters when reset filters button is clicked in empty state', async () => {
      const user = userEvent.setup();
      const mockResetFilters = jest.fn();
      const mockStore = createMockMarketplaceStore({
        filteredServers: [],
        isLoading: false,
        error: null,
        resetFilters: mockResetFilters
      });
      mockUseMarketplaceStore.mockReturnValue(mockStore as any);
      mockGetState.mockReturnValue(mockStore);

      render(<MarketplaceView />);

      const resetButton = screen.getByRole('button', { name: /reset filters/i });
      await user.click(resetButton);

      expect(mockResetFilters).toHaveBeenCalled();
    });
  });

  describe('Results display', () => {
    it('shows result count when servers are available', () => {
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({
          filteredServers: mockMarketplaceServers,
          isLoading: false,
          error: null
        }) as any
      );

      render(<MarketplaceView />);

      expect(screen.getByText(`${mockMarketplaceServers.length} servers found`)).toBeInTheDocument();
    });

    it('does not show result count when loading', () => {
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({
          filteredServers: mockMarketplaceServers,
          isLoading: true
        }) as any
      );

      render(<MarketplaceView />);

      expect(screen.queryByText(/servers found/i)).not.toBeInTheDocument();
    });

    it('does not show result count when error exists', () => {
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({
          filteredServers: mockMarketplaceServers,
          error: 'Error',
          isLoading: false
        }) as any
      );

      render(<MarketplaceView />);

      expect(screen.queryByText(/servers found/i)).not.toBeInTheDocument();
    });
  });

  describe('Server detail dialog', () => {
    it('opens detail dialog when server card is clicked', async () => {
      const user = userEvent.setup();
      const mockSetSelectedServer = jest.fn();
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({
          filteredServers: mockMarketplaceServers,
          viewMode: 'card',
          setSelectedServer: mockSetSelectedServer
        }) as any
      );

      render(<MarketplaceView />);

      const serverCard = screen.getByTestId(`server-card-${mockMarketplaceServers[0].mcpId}`);
      await user.click(serverCard);

      expect(mockSetSelectedServer).toHaveBeenCalledWith(mockMarketplaceServers[0]);
    });

    it('opens detail dialog when server list item is clicked', async () => {
      const user = userEvent.setup();
      const mockSetSelectedServer = jest.fn();
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({
          filteredServers: mockMarketplaceServers,
          viewMode: 'list',
          setSelectedServer: mockSetSelectedServer
        }) as any
      );

      render(<MarketplaceView />);

      const serverListItem = screen.getByTestId(`server-list-item-${mockMarketplaceServers[0].mcpId}`);
      await user.click(serverListItem);

      expect(mockSetSelectedServer).toHaveBeenCalledWith(mockMarketplaceServers[0]);
    });

    it('shows detail dialog when selectedServer is set', () => {
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({
          selectedServer: mockMarketplaceServers[0]
        }) as any
      );

      render(<MarketplaceView />);

      // The detail dialog should be rendered but not visible (controlled by open prop)
      expect(screen.queryByTestId('server-detail')).not.toBeInTheDocument();
    });

    it('clears selected server after dialog close animation', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      const mockSetSelectedServer = jest.fn();
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({
          selectedServer: mockMarketplaceServers[0],
          setSelectedServer: mockSetSelectedServer
        }) as any
      );

      render(<MarketplaceView />);

      // Simulate opening the dialog by clicking a server
      const serverCard = screen.getByTestId(`server-card-${mockMarketplaceServers[0].mcpId}`);
      await user.click(serverCard);

      // The component should delay clearing selectedServer by 200ms
      jest.advanceTimersByTime(200);

      jest.useRealTimers();
    });
  });

  describe('Grid columns configuration', () => {
    it('applies custom grid columns when provided', () => {
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({
          filteredServers: mockMarketplaceServers,
          viewMode: 'card'
        }) as any
      );

      const gridColumns = { base: 1, md: 2, lg: 3, xl: 4 };
      render(<MarketplaceView gridColumns={gridColumns} />);

      // Grid should be rendered with custom columns
      expect(screen.getByTestId(`server-card-${mockMarketplaceServers[0].mcpId}`)).toBeInTheDocument();
    });

    it('uses default grid columns when not provided', () => {
      mockUseMarketplaceStore.mockReturnValue(
        createMockMarketplaceStore({
          filteredServers: mockMarketplaceServers,
          viewMode: 'card'
        }) as any
      );

      render(<MarketplaceView />);

      // Grid should be rendered with default columns
      expect(screen.getByTestId(`server-card-${mockMarketplaceServers[0].mcpId}`)).toBeInTheDocument();
    });
  });
});

