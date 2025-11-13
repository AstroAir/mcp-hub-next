/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarketplaceServerListItem } from './marketplace-server-list-item';
import { useServerStore } from '@/lib/stores';
import { installationAPI } from '@/lib/services/api-client';
import { 
  createMockMarketplaceServer, 
  mockInstallationResponses,
  createMockServerStore 
} from '@/lib/__tests__/fixtures/marketplace-data';
import { toast } from 'sonner';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: any) => {
    const translations: Record<string, string> = {
      'badges.recommended': 'Recommended',
      'author': `By ${params?.author || 'Author'}`,
      'stats.stars': 'stars',
      'stats.downloads': 'downloads',
      'stats.requiresApiKey': 'API key required',
      'buttons.github': 'GitHub',
      'buttons.install': 'Install',
      'buttons.installing': 'Installing...',
      'buttons.details': 'Details',
      'dialog.installing': `Installing ${params?.name || 'server'}...`,
      'parseRepository': 'Failed to parse GitHub repository URL',
      'installing': `Installing ${params?.name || 'server'}...`,
      'installed': `${params?.name || 'Server'} installed successfully`,
      'installStartFailed': 'Failed to start installation',
    };
    return translations[key] || key;
  },
}));

// Mock stores
jest.mock('@/lib/stores', () => ({
  useServerStore: jest.fn(),
}));

// Mock API client
jest.mock('@/lib/services/api-client', () => ({
  installationAPI: {
    install: jest.fn(),
  },
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock error-dedupe utilities
jest.mock('@/lib/utils/error-dedupe', () => ({
  shouldNotify: jest.fn(() => true),
  buildErrorKey: jest.fn((type, id, msg) => `${type}-${id}-${msg}`),
}));

// Mock InstallationProgressCard component
jest.mock('@/components/mcp/installation-progress', () => ({
  InstallationProgressCard: ({ installId, onComplete, onError }: any) => (
    <div data-testid="installation-progress">
      <div>Install ID: {installId}</div>
      <button onClick={onComplete}>Complete</button>
      <button onClick={() => onError('Test error')}>Error</button>
    </div>
  ),
}));

const mockUseServerStore = useServerStore as jest.MockedFunction<typeof useServerStore>;
const mockInstallationAPI = installationAPI as jest.Mocked<typeof installationAPI>;

describe('MarketplaceServerListItem', () => {
  const mockServer = createMockMarketplaceServer();
  const mockOnViewDetails = jest.fn();
  const defaultMockStore = createMockServerStore();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseServerStore.mockReturnValue(defaultMockStore as any);
    global.window.open = jest.fn();
  });

  describe('Rendering', () => {
    it('renders server name and description', () => {
      render(<MarketplaceServerListItem server={mockServer} onViewDetails={mockOnViewDetails} />);
      
      expect(screen.getByText(mockServer.name)).toBeInTheDocument();
      expect(screen.getByText(mockServer.description)).toBeInTheDocument();
    });

    it('renders author information', () => {
      render(<MarketplaceServerListItem server={mockServer} onViewDetails={mockOnViewDetails} />);
      
      expect(screen.getByText(`By ${mockServer.author}`)).toBeInTheDocument();
    });

    it('renders recommended badge when server is recommended', () => {
      const recommendedServer = createMockMarketplaceServer({ isRecommended: true });
      render(<MarketplaceServerListItem server={recommendedServer} onViewDetails={mockOnViewDetails} />);
      
      expect(screen.getByText('Recommended')).toBeInTheDocument();
    });

    it('does not render recommended badge when server is not recommended', () => {
      const normalServer = createMockMarketplaceServer({ isRecommended: false });
      render(<MarketplaceServerListItem server={normalServer} onViewDetails={mockOnViewDetails} />);
      
      expect(screen.queryByText('Recommended')).not.toBeInTheDocument();
    });

    it('renders category badge', () => {
      render(<MarketplaceServerListItem server={mockServer} onViewDetails={mockOnViewDetails} />);
      
      expect(screen.getByText(mockServer.category)).toBeInTheDocument();
    });

    it('renders tags (up to 4)', () => {
      const serverWithTags = createMockMarketplaceServer({ 
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'] 
      });
      render(<MarketplaceServerListItem server={serverWithTags} onViewDetails={mockOnViewDetails} />);
      
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
      expect(screen.getByText('tag4')).toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    it('renders GitHub stars count on large screens', () => {
      render(<MarketplaceServerListItem server={mockServer} onViewDetails={mockOnViewDetails} />);
      
      // Stats are hidden on small screens (lg:flex), so we just check they exist in DOM
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('stars')).toBeInTheDocument();
    });

    it('renders download count on large screens', () => {
      render(<MarketplaceServerListItem server={mockServer} onViewDetails={mockOnViewDetails} />);
      
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('downloads')).toBeInTheDocument();
    });

    it('renders API key required indicator when applicable', () => {
      const serverWithApiKey = createMockMarketplaceServer({ requiresApiKey: true });
      render(<MarketplaceServerListItem server={serverWithApiKey} onViewDetails={mockOnViewDetails} />);
      
      expect(screen.getByText('API key required')).toBeInTheDocument();
    });

    it('renders avatar with fallback text', () => {
      render(<MarketplaceServerListItem server={mockServer} onViewDetails={mockOnViewDetails} />);

      // Avatar fallback shows first 2 characters of server name
      expect(screen.getByText('TE')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<MarketplaceServerListItem server={mockServer} onViewDetails={mockOnViewDetails} />);
      
      expect(screen.getByRole('button', { name: /install/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /details/i })).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onViewDetails when list item is clicked', async () => {
      const user = userEvent.setup();
      render(<MarketplaceServerListItem server={mockServer} onViewDetails={mockOnViewDetails} />);
      
      const listItem = screen.getByText(mockServer.name).closest('div[class*="cursor-pointer"]');
      if (listItem) {
        await user.click(listItem);
        expect(mockOnViewDetails).toHaveBeenCalledWith(mockServer);
      }
    });

    it('opens GitHub URL when GitHub button is clicked', async () => {
      const user = userEvent.setup();
      render(<MarketplaceServerListItem server={mockServer} onViewDetails={mockOnViewDetails} />);
      
      const githubButton = screen.getByRole('button', { name: /github/i });
      await user.click(githubButton);
      
      expect(window.open).toHaveBeenCalledWith(
        mockServer.githubUrl,
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('does not call onViewDetails when GitHub button is clicked', async () => {
      const user = userEvent.setup();
      render(<MarketplaceServerListItem server={mockServer} onViewDetails={mockOnViewDetails} />);
      
      const githubButton = screen.getByRole('button', { name: /github/i });
      await user.click(githubButton);
      
      expect(mockOnViewDetails).not.toHaveBeenCalled();
    });

    it('calls onViewDetails when Details button is clicked', async () => {
      const user = userEvent.setup();
      render(<MarketplaceServerListItem server={mockServer} onViewDetails={mockOnViewDetails} />);
      
      const detailsButton = screen.getByRole('button', { name: /details/i });
      await user.click(detailsButton);
      
      expect(mockOnViewDetails).toHaveBeenCalledWith(mockServer);
    });

    it('does not propagate click to list item when Details button is clicked', async () => {
      const user = userEvent.setup();
      render(<MarketplaceServerListItem server={mockServer} onViewDetails={mockOnViewDetails} />);
      
      const detailsButton = screen.getByRole('button', { name: /details/i });
      await user.click(detailsButton);
      
      // Should only be called once from the button, not from the list item
      expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
    });
  });

  describe('Installation', () => {
    it('starts installation when Install button is clicked', async () => {
      const user = userEvent.setup();
      mockInstallationAPI.install.mockResolvedValue(mockInstallationResponses.success);
      
      render(<MarketplaceServerListItem server={mockServer} onViewDetails={mockOnViewDetails} />);
      
      const installButton = screen.getByRole('button', { name: /install/i });
      await user.click(installButton);
      
      await waitFor(() => {
        expect(mockInstallationAPI.install).toHaveBeenCalledWith({
          config: { source: 'github', repository: 'test/server' },
          serverName: mockServer.name,
          serverDescription: mockServer.description,
        });
      });
    });

    it('does not propagate click to list item when Install button is clicked', async () => {
      const user = userEvent.setup();
      mockInstallationAPI.install.mockResolvedValue(mockInstallationResponses.success);
      
      render(<MarketplaceServerListItem server={mockServer} onViewDetails={mockOnViewDetails} />);
      
      const installButton = screen.getByRole('button', { name: /install/i });
      await user.click(installButton);
      
      expect(mockOnViewDetails).not.toHaveBeenCalled();
    });

    it('shows installing state during installation', async () => {
      const user = userEvent.setup();
      mockInstallationAPI.install.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockInstallationResponses.success), 100))
      );
      
      render(<MarketplaceServerListItem server={mockServer} onViewDetails={mockOnViewDetails} />);
      
      const installButton = screen.getByRole('button', { name: /install/i });
      await user.click(installButton);
      
      expect(screen.getByRole('button', { name: /installing/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /installing/i })).toBeDisabled();
    });

    it('shows installing state during installation', async () => {
      const user = userEvent.setup();
      mockInstallationAPI.install.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockInstallationResponses.success), 100))
      );

      render(<MarketplaceServerListItem server={mockServer} onViewDetails={mockOnViewDetails} />);

      const installButton = screen.getByRole('button', { name: /install/i });
      await user.click(installButton);

      // Should show installing state
      expect(screen.getByRole('button', { name: /installing/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /installing/i })).toBeDisabled();
    });

    it('shows error toast when GitHub URL parsing fails', async () => {
      const user = userEvent.setup();
      const invalidServer = createMockMarketplaceServer({ 
        githubUrl: 'https://invalid-url.com/repo' 
      });
      
      render(<MarketplaceServerListItem server={invalidServer} onViewDetails={mockOnViewDetails} />);
      
      const installButton = screen.getByRole('button', { name: /install/i });
      await user.click(installButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to parse GitHub repository URL');
      });
    });

    it('shows error toast when installation fails', async () => {
      const user = userEvent.setup();
      mockInstallationAPI.install.mockResolvedValue(mockInstallationResponses.error);

      render(<MarketplaceServerListItem server={mockServer} onViewDetails={mockOnViewDetails} />);

      const installButton = screen.getByRole('button', { name: /install/i });
      await user.click(installButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Installation failed');
      });
    });
  });
});

