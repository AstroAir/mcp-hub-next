/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarketplaceServerDetail } from './marketplace-server-detail';
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
      'stats.updated': `Updated ${params?.date || 'date'}`,
      'meta.category': 'Category',
      'meta.tags': 'Tags',
      'mcpId.label': 'MCP ID',
      'mcpId.copy': 'Copy',
      'mcpId.copied': 'Copied!',
      'actions.viewOnGitHub': 'View on GitHub',
      'readme.title': 'README',
      'buttons.install': 'Install',
      'buttons.installing': 'Installing...',
      'parseRepository': 'Failed to parse GitHub repository URL',
      'installing': `Installing ${params?.name || 'server'}...`,
      'installed': `${params?.name || 'Server'} installed successfully`,
      'installStartFailed': 'Failed to start installation',
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
    useServerStore: mockFn,
  };
});

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

// Mock react-markdown
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

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
const mockGetState = (mockUseServerStore as any).getState as jest.Mock;
const mockInstallationAPI = installationAPI as jest.Mocked<typeof installationAPI>;

// Mock clipboard API globally
const mockWriteText = jest.fn(() => Promise.resolve());
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('MarketplaceServerDetail', () => {
  const mockServer = createMockMarketplaceServer();
  const mockOnOpenChange = jest.fn();
  const defaultMockStore = createMockServerStore();

  const mockRegisterInstallationRequest = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseServerStore.mockReturnValue(defaultMockStore as any);
    mockGetState.mockReturnValue({
      ...defaultMockStore,
      registerInstallationRequest: mockRegisterInstallationRequest,
    });
    global.window.open = jest.fn();
    mockWriteText.mockClear();
  });

  describe('Rendering', () => {
    it('renders nothing when server is null', () => {
      const { container } = render(
        <MarketplaceServerDetail server={null} open={true} onOpenChange={mockOnOpenChange} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders server name and description', () => {
      render(
        <MarketplaceServerDetail server={mockServer} open={true} onOpenChange={mockOnOpenChange} />
      );
      
      expect(screen.getByText(mockServer.name)).toBeInTheDocument();
      expect(screen.getByText(mockServer.description)).toBeInTheDocument();
    });

    it('renders author information', () => {
      render(
        <MarketplaceServerDetail server={mockServer} open={true} onOpenChange={mockOnOpenChange} />
      );
      
      expect(screen.getByText(`By ${mockServer.author}`)).toBeInTheDocument();
    });

    it('renders recommended badge when server is recommended', () => {
      const recommendedServer = createMockMarketplaceServer({ isRecommended: true });
      render(
        <MarketplaceServerDetail server={recommendedServer} open={true} onOpenChange={mockOnOpenChange} />
      );
      
      expect(screen.getByText('Recommended')).toBeInTheDocument();
    });

    it('renders stats (stars, downloads, updated date)', () => {
      render(
        <MarketplaceServerDetail server={mockServer} open={true} onOpenChange={mockOnOpenChange} />
      );
      
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText(/updated/i)).toBeInTheDocument();
    });

    it('renders API key required indicator when applicable', () => {
      const serverWithApiKey = createMockMarketplaceServer({ requiresApiKey: true });
      render(
        <MarketplaceServerDetail server={serverWithApiKey} open={true} onOpenChange={mockOnOpenChange} />
      );
      
      expect(screen.getByText('API key required')).toBeInTheDocument();
    });

    it('renders category', () => {
      render(
        <MarketplaceServerDetail server={mockServer} open={true} onOpenChange={mockOnOpenChange} />
      );
      
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText(mockServer.category)).toBeInTheDocument();
    });

    it('renders tags', () => {
      render(
        <MarketplaceServerDetail server={mockServer} open={true} onOpenChange={mockOnOpenChange} />
      );
      
      expect(screen.getByText('Tags')).toBeInTheDocument();
      mockServer.tags.forEach(tag => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });

    it('renders MCP ID with copy button', () => {
      render(
        <MarketplaceServerDetail server={mockServer} open={true} onOpenChange={mockOnOpenChange} />
      );
      
      expect(screen.getByText('MCP ID')).toBeInTheDocument();
      expect(screen.getByText(mockServer.mcpId)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(
        <MarketplaceServerDetail server={mockServer} open={true} onOpenChange={mockOnOpenChange} />
      );
      
      expect(screen.getByRole('button', { name: /view on github/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /install/i })).toBeInTheDocument();
    });

    it('renders README collapsible section', () => {
      render(
        <MarketplaceServerDetail server={mockServer} open={true} onOpenChange={mockOnOpenChange} />
      );
      
      expect(screen.getByRole('button', { name: /readme/i })).toBeInTheDocument();
    });
  });

  describe('Copy MCP ID', () => {
    it('shows "Copied!" message after copying', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceServerDetail server={mockServer} open={true} onOpenChange={mockOnOpenChange} />
      );

      // Wait for dialog content to be rendered
      await waitFor(() => {
        expect(screen.getByText(mockServer.mcpId)).toBeInTheDocument();
      });

      // Find the copy button
      const copyButtons = screen.getAllByRole('button');
      const copyButton = copyButtons.find(btn => btn.textContent?.includes('Copy'));

      expect(copyButton).toBeDefined();

      if (copyButton) {
        await user.click(copyButton);

        await waitFor(() => {
          expect(screen.getByText('Copied!')).toBeInTheDocument();
        });
      }
    });

    it('resets "Copied!" message after 2 seconds', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      render(
        <MarketplaceServerDetail server={mockServer} open={true} onOpenChange={mockOnOpenChange} />
      );

      // Wait for dialog content to be rendered
      await waitFor(() => {
        expect(screen.getByText(mockServer.mcpId)).toBeInTheDocument();
      });

      // Find the copy button
      const copyButtons = screen.getAllByRole('button');
      const copyButton = copyButtons.find(btn => btn.textContent?.includes('Copy'));

      expect(copyButton).toBeDefined();

      if (copyButton) {
        await user.click(copyButton);

        expect(screen.getByText('Copied!')).toBeInTheDocument();

        jest.advanceTimersByTime(2000);

        await waitFor(() => {
          expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
        });
      }

      jest.useRealTimers();
    });
  });

  describe('GitHub link', () => {
    it('opens GitHub URL when View on GitHub button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceServerDetail server={mockServer} open={true} onOpenChange={mockOnOpenChange} />
      );
      
      const githubButton = screen.getByRole('button', { name: /view on github/i });
      await user.click(githubButton);
      
      expect(window.open).toHaveBeenCalledWith(
        mockServer.githubUrl,
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('README collapsible', () => {
    it('expands README when clicked', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceServerDetail server={mockServer} open={true} onOpenChange={mockOnOpenChange} />
      );
      
      const readmeButton = screen.getByRole('button', { name: /readme/i });
      await user.click(readmeButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      });
    });

    it('renders README content in markdown', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceServerDetail server={mockServer} open={true} onOpenChange={mockOnOpenChange} />
      );
      
      const readmeButton = screen.getByRole('button', { name: /readme/i });
      await user.click(readmeButton);
      
      await waitFor(() => {
        const markdownContent = screen.getByTestId('markdown-content');
        // Check for the heading and content (whitespace may vary in markdown rendering)
        expect(markdownContent.textContent).toContain('# Test Server');
        expect(markdownContent.textContent).toContain('This is a test server.');
      });
    });
  });

  describe('Installation', () => {
    it('starts installation when Install button is clicked', async () => {
      const user = userEvent.setup();
      mockInstallationAPI.install.mockResolvedValue(mockInstallationResponses.success);
      
      render(
        <MarketplaceServerDetail server={mockServer} open={true} onOpenChange={mockOnOpenChange} />
      );
      
      const installButton = screen.getByRole('button', { name: /^install$/i });
      await user.click(installButton);
      
      await waitFor(() => {
        expect(mockInstallationAPI.install).toHaveBeenCalledWith({
          config: { source: 'github', repository: 'test/server' },
          serverName: mockServer.name,
          serverDescription: mockServer.description,
        });
      });
    });

    it('shows installing state during installation', async () => {
      const user = userEvent.setup();
      mockInstallationAPI.install.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockInstallationResponses.success), 100))
      );
      
      render(
        <MarketplaceServerDetail server={mockServer} open={true} onOpenChange={mockOnOpenChange} />
      );
      
      const installButton = screen.getByRole('button', { name: /^install$/i });
      await user.click(installButton);
      
      expect(screen.getByRole('button', { name: /installing/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /installing/i })).toBeDisabled();
    });

    it('shows success toast on successful installation', async () => {
      const user = userEvent.setup();
      mockInstallationAPI.install.mockResolvedValue(mockInstallationResponses.success);
      
      render(
        <MarketplaceServerDetail server={mockServer} open={true} onOpenChange={mockOnOpenChange} />
      );
      
      const installButton = screen.getByRole('button', { name: /^install$/i });
      await user.click(installButton);
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it('shows error toast when GitHub URL parsing fails', async () => {
      const user = userEvent.setup();
      const invalidServer = createMockMarketplaceServer({ 
        githubUrl: 'https://invalid-url.com/repo' 
      });
      
      render(
        <MarketplaceServerDetail server={invalidServer} open={true} onOpenChange={mockOnOpenChange} />
      );
      
      const installButton = screen.getByRole('button', { name: /^install$/i });
      await user.click(installButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to parse GitHub repository URL');
      });
    });
  });
});

