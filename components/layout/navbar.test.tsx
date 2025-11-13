/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { Navbar } from './navbar';

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/navigation
const mockPathname = jest.fn(() => '/');
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock ui/button
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, size, className, ...props }: any) => (
    <button
      className={`button ${variant} ${size} ${className || ''}`}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue('/');
  });

  it('renders without crashing', () => {
    const { container } = render(<Navbar />);
    expect(container).toBeInTheDocument();
  });

  it('renders nav element', () => {
    render(<Navbar />);

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('renders MCP Hub logo', () => {
    render(<Navbar />);

    expect(screen.getByText('MCP Hub')).toBeInTheDocument();
  });

  it('renders logo as link to home', () => {
    render(<Navbar />);

    const logoLink = screen.getByRole('link', { name: /MCP Hub/ });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders all navigation items', () => {
    render(<Navbar />);

    expect(screen.getByText('common.navigation.dashboard')).toBeInTheDocument();
    expect(screen.getByText('common.navigation.chat')).toBeInTheDocument();
    expect(screen.getByText('common.navigation.developer')).toBeInTheDocument();
    expect(screen.getByText('common.navigation.settings')).toBeInTheDocument();
  });

  it('renders navigation items as links with correct hrefs', () => {
    render(<Navbar />);

    expect(screen.getByRole('link', { name: /dashboard/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /chat/ })).toHaveAttribute('href', '/chat');
    expect(screen.getByRole('link', { name: /developer/ })).toHaveAttribute('href', '/developer');
    expect(screen.getByRole('link', { name: /settings/ })).toHaveAttribute('href', '/settings');
  });

  it('marks dashboard button as active when on root path', () => {
    mockPathname.mockReturnValue('/');
    render(<Navbar />);

    const links = screen.getAllByRole('link');
    const dashboardLink = links.find((link) =>
      link.textContent?.includes('dashboard')
    );
    const button = dashboardLink?.querySelector('button');

    expect(button).toHaveAttribute('data-variant', 'default');
  });

  it('marks chat button as active when on chat path', () => {
    mockPathname.mockReturnValue('/chat');
    render(<Navbar />);

    const links = screen.getAllByRole('link');
    const chatLink = links.find((link) => link.textContent?.includes('chat'));
    const button = chatLink?.querySelector('button');

    expect(button).toHaveAttribute('data-variant', 'default');
  });

  it('marks developer button as active when on developer path', () => {
    mockPathname.mockReturnValue('/developer');
    render(<Navbar />);

    const links = screen.getAllByRole('link');
    const developerLink = links.find((link) =>
      link.textContent?.includes('developer')
    );
    const button = developerLink?.querySelector('button');

    expect(button).toHaveAttribute('data-variant', 'default');
  });

  it('marks settings button as active when on settings path', () => {
    mockPathname.mockReturnValue('/settings');
    render(<Navbar />);

    const links = screen.getAllByRole('link');
    const settingsLink = links.find((link) =>
      link.textContent?.includes('settings')
    );
    const button = settingsLink?.querySelector('button');

    expect(button).toHaveAttribute('data-variant', 'default');
  });

  it('uses ghost variant for inactive buttons', () => {
    mockPathname.mockReturnValue('/');
    render(<Navbar />);

    const links = screen.getAllByRole('link');
    const chatLink = links.find((link) => link.textContent?.includes('chat'));
    const button = chatLink?.querySelector('button');

    expect(button).toHaveAttribute('data-variant', 'ghost');
  });

  it('marks nested paths as active for non-root items', () => {
    mockPathname.mockReturnValue('/settings/appearance');
    render(<Navbar />);

    const links = screen.getAllByRole('link');
    const settingsLink = links.find((link) =>
      link.textContent?.includes('settings')
    );
    const button = settingsLink?.querySelector('button');

    expect(button).toHaveAttribute('data-variant', 'default');
  });

  it('does not mark dashboard active for nested paths', () => {
    mockPathname.mockReturnValue('/chat');
    render(<Navbar />);

    const links = screen.getAllByRole('link');
    const dashboardLink = links.find((link) =>
      link.textContent?.includes('dashboard')
    );
    const button = dashboardLink?.querySelector('button');

    expect(button).toHaveAttribute('data-variant', 'ghost');
  });

  it('renders icons for each navigation item', () => {
    const { container } = render(<Navbar />);

    // Logo icon + 4 nav item icons = 5 icons
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBe(5);
  });

  it('applies border and background classes to nav', () => {
    render(<Navbar />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('border-b', 'bg-background');
  });

  it('applies container and responsive classes', () => {
    const { container } = render(<Navbar />);

    const innerDiv = container.querySelector('.container');
    expect(innerDiv).toBeInTheDocument();
    expect(innerDiv).toHaveClass('mx-auto', 'px-4');
  });

  it('applies correct height class', () => {
    const { container } = render(<Navbar />);

    const innerFlex = container.querySelector('.h-16');
    expect(innerFlex).toBeInTheDocument();
  });

  it('applies small size to all navigation buttons', () => {
    render(<Navbar />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('data-size', 'sm');
    });
  });

  it('hides logo text on extra small screens', () => {
    render(<Navbar />);

    const logoText = screen.getByText('MCP Hub');
    expect(logoText).toHaveClass('hidden', 'xs:inline', 'sm:inline');
  });

  it('hides nav item labels on small screens', () => {
    render(<Navbar />);

    const dashboardLabel = screen.getByText('common.navigation.dashboard');
    expect(dashboardLabel).toHaveClass('hidden', 'sm:inline');
  });

  it('applies responsive icon sizes', () => {
    const { container } = render(<Navbar />);

    const logoIcon = container.querySelector('.h-5');
    expect(logoIcon).toBeInTheDocument();
    expect(logoIcon).toHaveClass('w-5', 'sm:h-6', 'sm:w-6');
  });

  it('applies gap spacing to buttons', () => {
    render(<Navbar />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('gap-1', 'sm:gap-2');
    });
  });

  it('applies correct active state classes', () => {
    mockPathname.mockReturnValue('/');
    render(<Navbar />);

    const links = screen.getAllByRole('link');
    const dashboardLink = links.find((link) =>
      link.textContent?.includes('dashboard')
    );
    const button = dashboardLink?.querySelector('button');

    expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('renders logo with flex layout', () => {
    render(<Navbar />);

    const logoLink = screen.getByRole('link', { name: /MCP Hub/ });
    expect(logoLink).toHaveClass('flex', 'items-center', 'gap-2');
  });

  it('applies font styling to logo', () => {
    render(<Navbar />);

    const logoLink = screen.getByRole('link', { name: /MCP Hub/ });
    expect(logoLink).toHaveClass('font-bold', 'text-lg', 'sm:text-xl');
  });

  it('renders navigation items in correct order', () => {
    render(<Navbar />);

    const links = screen.getAllByRole('link').slice(1); // Skip logo link
    const labels = links.map((link) => link.textContent);

    expect(labels).toEqual([
      expect.stringContaining('dashboard'),
      expect.stringContaining('chat'),
      expect.stringContaining('developer'),
      expect.stringContaining('settings'),
    ]);
  });

  it('handles pathname changes correctly', () => {
    mockPathname.mockReturnValue('/');
    const { rerender } = render(<Navbar />);

    let links = screen.getAllByRole('link');
    let dashboardLink = links.find((link) =>
      link.textContent?.includes('dashboard')
    );
    let button = dashboardLink?.querySelector('button');

    expect(button).toHaveAttribute('data-variant', 'default');

    mockPathname.mockReturnValue('/chat');
    rerender(<Navbar />);

    links = screen.getAllByRole('link');
    dashboardLink = links.find((link) =>
      link.textContent?.includes('dashboard')
    );
    button = dashboardLink?.querySelector('button');

    expect(button).toHaveAttribute('data-variant', 'ghost');

    const chatLink = links.find((link) => link.textContent?.includes('chat'));
    const chatButton = chatLink?.querySelector('button');

    expect(chatButton).toHaveAttribute('data-variant', 'default');
  });

  it('renders exactly 4 navigation item links', () => {
    render(<Navbar />);

    const allLinks = screen.getAllByRole('link');
    // Logo + 4 nav items = 5 total links
    expect(allLinks).toHaveLength(5);
  });

  it('applies flex layout to navigation items container', () => {
    const { container } = render(<Navbar />);

    const navItemsContainer = container.querySelector('.gap-1');
    expect(navItemsContainer).toHaveClass('flex', 'items-center');
  });

  it('has correct structure with header and nav items', () => {
    const { container } = render(<Navbar />);

    const headerFlex = container.querySelector('.justify-between');
    expect(headerFlex).toBeInTheDocument();
    expect(headerFlex).toHaveClass('flex', 'items-center');
  });

  it('does not include marketplace in navbar', () => {
    render(<Navbar />);

    expect(screen.queryByText('common.navigation.marketplace')).not.toBeInTheDocument();
  });

  it('handles active state for root path correctly', () => {
    mockPathname.mockReturnValue('/');
    render(<Navbar />);

    const links = screen.getAllByRole('link');

    // Dashboard should be active
    const dashboardLink = links.find((link) =>
      link.textContent?.includes('dashboard')
    );
    const dashboardButton = dashboardLink?.querySelector('button');
    expect(dashboardButton).toHaveAttribute('data-variant', 'default');

    // Other items should not be active
    const chatLink = links.find((link) => link.textContent?.includes('chat'));
    const chatButton = chatLink?.querySelector('button');
    expect(chatButton).toHaveAttribute('data-variant', 'ghost');
  });

  it('handles deep nested paths correctly', () => {
    mockPathname.mockReturnValue('/settings/appearance/theme');
    render(<Navbar />);

    const links = screen.getAllByRole('link');
    const settingsLink = links.find((link) =>
      link.textContent?.includes('settings')
    );
    const button = settingsLink?.querySelector('button');

    expect(button).toHaveAttribute('data-variant', 'default');
  });
});
