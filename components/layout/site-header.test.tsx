/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { SiteHeader } from './site-header';
import { BreadcrumbItem } from './breadcrumb-provider';
import { ReactNode } from 'react';

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock ui/sidebar
jest.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: ({ className, ...props }: any) => (
    <button className={className} {...props}>
      Sidebar Trigger
    </button>
  ),
}));

// Mock ui/separator
jest.mock('@/components/ui/separator', () => ({
  Separator: ({ orientation, className }: any) => (
    <div className={`separator ${orientation} ${className}`} />
  ),
}));

// Mock the useBreadcrumbs hook
let mockBreadcrumbItems: BreadcrumbItem[] = [];

jest.mock('./breadcrumb-provider', () => ({
  useBreadcrumbs: jest.fn(() => ({
    items: mockBreadcrumbItems,
    setBreadcrumbs: jest.fn(),
  })),
}));

describe('SiteHeader', () => {
  beforeEach(() => {
    mockBreadcrumbItems = [];
  });

  it('renders without crashing', () => {
    const { container } = render(<SiteHeader />);
    expect(container).toBeInTheDocument();
  });

  it('renders header element with correct structure', () => {
    render(<SiteHeader />);

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header.tagName).toBe('HEADER');
  });

  it('renders sidebar trigger button', () => {
    render(<SiteHeader />);

    expect(screen.getByText('Sidebar Trigger')).toBeInTheDocument();
  });

  it('renders home icon link', () => {
    render(<SiteHeader />);

    const homeLink = screen.getByLabelText('Home');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('has correct accessibility label for sidebar trigger', () => {
    render(<SiteHeader />);

    const trigger = screen.getByText('Sidebar Trigger');
    expect(trigger).toHaveAttribute('aria-label', 'common.a11y.toggleMenu');
  });

  it('renders separator between trigger and breadcrumbs', () => {
    const { container } = render(<SiteHeader />);

    const separator = container.querySelector('.separator');
    expect(separator).toBeInTheDocument();
  });

  it('renders breadcrumbs navigation', () => {
    render(<SiteHeader />);

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('displays breadcrumb items from context', () => {
    mockBreadcrumbItems = [
      { label: 'Servers', href: '/servers' },
      { label: 'Configuration' },
    ];

    render(<SiteHeader />);

    expect(screen.getByText('Servers')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });

  it('renders breadcrumb items as links when href is provided', () => {
    mockBreadcrumbItems = [{ label: 'Servers', href: '/servers' }];

    render(<SiteHeader />);

    const link = screen.getByRole('link', { name: 'Servers' });
    expect(link).toHaveAttribute('href', '/servers');
  });

  it('renders breadcrumb items as text when href is not provided', () => {
    mockBreadcrumbItems = [{ label: 'Current Page' }];

    render(<SiteHeader />);

    const text = screen.getByText('Current Page');
    expect(text.tagName).toBe('SPAN');
  });

  it('applies sticky positioning classes', () => {
    render(<SiteHeader />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('sticky', 'top-0');
  });

  it('has correct z-index for stacking', () => {
    render(<SiteHeader />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('z-50');
  });

  it('applies backdrop blur effect', () => {
    render(<SiteHeader />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('backdrop-blur');
  });

  it('has responsive height classes', () => {
    render(<SiteHeader />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('h-14', 'md:h-16');
  });

  it('has responsive padding classes', () => {
    render(<SiteHeader />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('px-3', 'md:px-4');
  });

  it('renders chevron separators between breadcrumb items', () => {
    mockBreadcrumbItems = [
      { label: 'Level 1', href: '/level1' },
      { label: 'Level 2', href: '/level2' },
      { label: 'Level 3' },
    ];

    const { container } = render(<SiteHeader />);

    // Home icon + 3 chevrons (one for each breadcrumb item)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBe(4);
  });

  it('applies border-b class', () => {
    render(<SiteHeader />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('border-b');
  });

  it('has correct background color classes', () => {
    render(<SiteHeader />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-background/95');
  });

  it('renders with empty breadcrumbs', () => {
    mockBreadcrumbItems = [];

    render(<SiteHeader />);

    // Should only show home link
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/');
  });

  it('handles long breadcrumb labels with truncation', () => {
    mockBreadcrumbItems = [
      {
        label: 'This is a very long breadcrumb label that should be truncated',
      },
    ];

    render(<SiteHeader />);

    const label = screen.getByText(
      'This is a very long breadcrumb label that should be truncated'
    );
    expect(label).toHaveClass('truncate');
  });

  it('has responsive text size classes for breadcrumbs', () => {
    render(<SiteHeader />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('text-xs', 'md:text-sm');
  });

  it('hides separator on small screens', () => {
    const { container } = render(<SiteHeader />);

    const separator = container.querySelector('.separator');
    expect(separator).toHaveClass('hidden', 'sm:block');
  });

  it('applies correct flex layout classes', () => {
    render(<SiteHeader />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('flex', 'items-center');
  });

  it('has correct gap spacing', () => {
    render(<SiteHeader />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('gap-2');
  });

  it('applies shrink-0 class to prevent header shrinking', () => {
    render(<SiteHeader />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('shrink-0');
  });

  it('has horizontal scrolling for breadcrumbs on small screens', () => {
    render(<SiteHeader />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('overflow-x-auto');
  });

  it('applies responsive icon sizes', () => {
    const { container } = render(<SiteHeader />);

    // Home icon should have responsive size classes
    const homeLink = screen.getByLabelText('Home');
    const icon = homeLink.querySelector('svg');
    expect(icon).toHaveClass('h-3.5', 'w-3.5', 'md:h-4', 'md:w-4');
  });

  it('renders multiple breadcrumb items correctly', () => {
    mockBreadcrumbItems = [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Category', href: '/products/category' },
      { label: 'Item' },
    ];

    render(<SiteHeader />);

    // All breadcrumb items should be rendered
    mockBreadcrumbItems.forEach((item) => {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    });
  });

  it('renders links with hover transition classes', () => {
    mockBreadcrumbItems = [{ label: 'Test', href: '/test' }];

    render(<SiteHeader />);

    const link = screen.getByRole('link', { name: 'Test' });
    expect(link).toHaveClass('hover:text-foreground', 'transition-colors');
  });

  it('applies correct text color to muted breadcrumbs', () => {
    render(<SiteHeader />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('text-muted-foreground');
  });

  it('applies font weight to current breadcrumb', () => {
    mockBreadcrumbItems = [{ label: 'Current' }];

    render(<SiteHeader />);

    const current = screen.getByText('Current');
    expect(current).toHaveClass('font-medium');
  });

  it('applies max-width constraint to breadcrumb labels on mobile', () => {
    mockBreadcrumbItems = [{ label: 'Long Label' }];

    render(<SiteHeader />);

    const label = screen.getByText('Long Label');
    expect(label).toHaveClass('max-w-[120px]');
  });

  it('applies responsive width constraints', () => {
    mockBreadcrumbItems = [{ label: 'Test', href: '/test' }];

    render(<SiteHeader />);

    const link = screen.getByRole('link', { name: 'Test' });
    expect(link).toHaveClass('md:max-w-none');
  });
});
