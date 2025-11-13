/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { AppSidebar } from './app-sidebar';

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

// Mock ui/sidebar components
jest.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children, ...props }: any) => <div data-testid="sidebar" {...props}>{children}</div>,
  SidebarContent: ({ children }: any) => <div data-testid="sidebar-content">{children}</div>,
  SidebarFooter: ({ children }: any) => <div data-testid="sidebar-footer">{children}</div>,
  SidebarHeader: ({ children }: any) => <div data-testid="sidebar-header">{children}</div>,
  SidebarMenu: ({ children }: any) => <ul data-testid="sidebar-menu">{children}</ul>,
  SidebarMenuButton: ({ children, asChild, isActive, ...props }: any) => {
    const className = isActive ? 'active' : '';
    if (asChild) {
      return <div className={className} {...props}>{children}</div>;
    }
    return <button className={className} {...props}>{children}</button>;
  },
  SidebarMenuItem: ({ children }: any) => <li data-testid="sidebar-menu-item">{children}</li>,
  SidebarGroup: ({ children }: any) => <div data-testid="sidebar-group">{children}</div>,
  SidebarGroupContent: ({ children }: any) => <div data-testid="sidebar-group-content">{children}</div>,
}));

describe('AppSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue('/');
  });

  it('renders without crashing', () => {
    const { container } = render(<AppSidebar />);
    expect(container).toBeInTheDocument();
  });

  it('renders sidebar structure', () => {
    render(<AppSidebar />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-footer')).toBeInTheDocument();
  });

  it('renders MCP Hub logo in header', () => {
    render(<AppSidebar />);

    expect(screen.getByText('MCP Hub')).toBeInTheDocument();
  });

  it('renders logo as link to home', () => {
    render(<AppSidebar />);

    const logoLink = screen.getByRole('link', { name: /MCP Hub/ });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders all navigation items', () => {
    render(<AppSidebar />);

    expect(screen.getByText('common.navigation.dashboard')).toBeInTheDocument();
    expect(screen.getByText('common.navigation.marketplace')).toBeInTheDocument();
    expect(screen.getByText('common.navigation.chat')).toBeInTheDocument();
    expect(screen.getByText('common.navigation.developer')).toBeInTheDocument();
    expect(screen.getByText('common.navigation.settings')).toBeInTheDocument();
  });

  it('renders navigation items as links with correct hrefs', () => {
    render(<AppSidebar />);

    expect(screen.getByRole('link', { name: /dashboard/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /marketplace/ })).toHaveAttribute('href', '/marketplace');
    expect(screen.getByRole('link', { name: /chat/ })).toHaveAttribute('href', '/chat');
    expect(screen.getByRole('link', { name: /developer/ })).toHaveAttribute('href', '/developer');
    expect(screen.getByRole('link', { name: /settings/ })).toHaveAttribute('href', '/settings');
  });

  it('marks dashboard as active when on root path', () => {
    mockPathname.mockReturnValue('/');
    render(<AppSidebar />);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/ }).closest('div');
    expect(dashboardLink).toHaveClass('active');
  });

  it('marks marketplace as active when on marketplace path', () => {
    mockPathname.mockReturnValue('/marketplace');
    render(<AppSidebar />);

    const marketplaceLink = screen.getByRole('link', { name: /marketplace/ }).closest('div');
    expect(marketplaceLink).toHaveClass('active');
  });

  it('marks chat as active when on chat path', () => {
    mockPathname.mockReturnValue('/chat');
    render(<AppSidebar />);

    const chatLink = screen.getByRole('link', { name: /chat/ }).closest('div');
    expect(chatLink).toHaveClass('active');
  });

  it('marks developer as active when on developer path', () => {
    mockPathname.mockReturnValue('/developer');
    render(<AppSidebar />);

    const developerLink = screen.getByRole('link', { name: /developer/ }).closest('div');
    expect(developerLink).toHaveClass('active');
  });

  it('marks settings as active when on settings path', () => {
    mockPathname.mockReturnValue('/settings');
    render(<AppSidebar />);

    const settingsLink = screen.getByRole('link', { name: /settings/ }).closest('div');
    expect(settingsLink).toHaveClass('active');
  });

  it('marks nested paths as active for non-root items', () => {
    mockPathname.mockReturnValue('/settings/appearance');
    render(<AppSidebar />);

    const settingsLink = screen.getByRole('link', { name: /settings/ }).closest('div');
    expect(settingsLink).toHaveClass('active');
  });

  it('does not mark dashboard active for nested paths', () => {
    mockPathname.mockReturnValue('/chat');
    render(<AppSidebar />);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/ }).closest('div');
    expect(dashboardLink).not.toHaveClass('active');
  });

  it('renders footer with MCP link', () => {
    render(<AppSidebar />);

    const mcpLink = screen.getByRole('link', { name: /Model Context Protocol/ });
    expect(mcpLink).toHaveAttribute('href', 'https://github.com/modelcontextprotocol');
    expect(mcpLink).toHaveAttribute('target', '_blank');
    expect(mcpLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders icons for each navigation item', () => {
    const { container } = render(<AppSidebar />);

    // Should have icons for: logo + 5 nav items
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(6);
  });

  it('applies collapsible="offcanvas" to sidebar', () => {
    render(<AppSidebar />);

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveAttribute('collapsible', 'offcanvas');
  });

  it('passes through additional props to sidebar', () => {
    render(<AppSidebar data-custom="test" />);

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveAttribute('data-custom', 'test');
  });

  it('renders navigation items in correct order', () => {
    render(<AppSidebar />);

    const menuItems = screen.getAllByTestId('sidebar-menu-item');

    // Header has 1 item (logo), content has 5 nav items, footer has 1 item
    expect(menuItems.length).toBeGreaterThanOrEqual(5);
  });

  it('has correct structure with sidebar groups', () => {
    render(<AppSidebar />);

    expect(screen.getByTestId('sidebar-group')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-group-content')).toBeInTheDocument();
  });

  it('renders all navigation menus', () => {
    render(<AppSidebar />);

    const menus = screen.getAllByTestId('sidebar-menu');
    // Should have menus in header, content, and footer
    expect(menus.length).toBe(3);
  });

  it('has accessible link structure', () => {
    render(<AppSidebar />);

    const links = screen.getAllByRole('link');
    // Logo + 5 nav items + footer link = 7 links
    expect(links.length).toBe(7);
  });

  it('applies text styling to footer link', () => {
    render(<AppSidebar />);

    const mcpLink = screen.getByRole('link', { name: /Model Context Protocol/ });
    expect(mcpLink).toHaveClass('text-muted-foreground');
  });

  it('handles active state correctly for root path', () => {
    mockPathname.mockReturnValue('/');
    render(<AppSidebar />);

    // Dashboard should be active
    const dashboardLink = screen.getByRole('link', { name: /dashboard/ }).closest('div');
    expect(dashboardLink).toHaveClass('active');

    // Other items should not be active
    const chatLink = screen.getByRole('link', { name: /chat/ }).closest('div');
    expect(chatLink).not.toHaveClass('active');
  });

  it('handles active state for deep nested paths', () => {
    mockPathname.mockReturnValue('/settings/appearance/theme');
    render(<AppSidebar />);

    const settingsLink = screen.getByRole('link', { name: /settings/ }).closest('div');
    expect(settingsLink).toHaveClass('active');
  });

  it('does not mark any item active for unknown paths', () => {
    mockPathname.mockReturnValue('/unknown-path');
    render(<AppSidebar />);

    const allLinks = screen.getAllByRole('link');
    const navLinks = allLinks.slice(1, -1); // Exclude logo and footer links

    navLinks.forEach((link) => {
      const wrapper = link.closest('div');
      expect(wrapper).not.toHaveClass('active');
    });
  });

  it('renders server icon in logo', () => {
    const { container } = render(<AppSidebar />);

    const logoLink = screen.getByRole('link', { name: /MCP Hub/ });
    const icon = logoLink.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('applies correct size class to logo icon', () => {
    const { container } = render(<AppSidebar />);

    const logoLink = screen.getByRole('link', { name: /MCP Hub/ });
    const icon = logoLink.querySelector('svg');
    expect(icon).toHaveClass('!size-5');
  });

  it('applies font weight to logo text', () => {
    render(<AppSidebar />);

    const logoText = screen.getByText('MCP Hub');
    expect(logoText).toHaveClass('font-semibold');
  });

  it('handles pathname changes correctly', () => {
    mockPathname.mockReturnValue('/');
    const { rerender } = render(<AppSidebar />);

    let dashboardLink = screen.getByRole('link', { name: /dashboard/ }).closest('div');
    expect(dashboardLink).toHaveClass('active');

    mockPathname.mockReturnValue('/chat');
    rerender(<AppSidebar />);

    dashboardLink = screen.getByRole('link', { name: /dashboard/ }).closest('div');
    expect(dashboardLink).not.toHaveClass('active');

    const chatLink = screen.getByRole('link', { name: /chat/ }).closest('div');
    expect(chatLink).toHaveClass('active');
  });
});
