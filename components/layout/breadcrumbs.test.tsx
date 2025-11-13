/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { Breadcrumbs, BreadcrumbItem } from './breadcrumbs';

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Breadcrumbs', () => {
  const mockItems: BreadcrumbItem[] = [
    { label: 'Servers', href: '/servers' },
    { label: 'Configuration', href: '/servers/config' },
    { label: 'Details' },
  ];

  it('renders without crashing', () => {
    const { container } = render(<Breadcrumbs items={[]} />);
    expect(container).toBeInTheDocument();
  });

  it('renders home icon link', () => {
    render(<Breadcrumbs items={[]} />);
    const homeLink = screen.getByRole('link');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders all breadcrumb items', () => {
    render(<Breadcrumbs items={mockItems} />);

    expect(screen.getByText('Servers')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('renders items with href as links', () => {
    render(<Breadcrumbs items={mockItems} />);

    const serversLink = screen.getByRole('link', { name: 'Servers' });
    expect(serversLink).toHaveAttribute('href', '/servers');

    const configLink = screen.getByRole('link', { name: 'Configuration' });
    expect(configLink).toHaveAttribute('href', '/servers/config');
  });

  it('renders items without href as plain text', () => {
    render(<Breadcrumbs items={mockItems} />);

    const detailsText = screen.getByText('Details');
    expect(detailsText.tagName).toBe('SPAN');
    expect(detailsText).toHaveClass('text-foreground', 'font-medium');
  });

  it('renders chevron separators between items', () => {
    const { container } = render(<Breadcrumbs items={mockItems} />);

    // ChevronRight icons should be rendered (one per item)
    const chevrons = container.querySelectorAll('svg');
    // Home icon + 3 chevrons (one for each item)
    expect(chevrons.length).toBe(4);
  });

  it('applies custom className', () => {
    const { container } = render(
      <Breadcrumbs items={mockItems} className="custom-class" />
    );

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('custom-class');
  });

  it('renders correctly with a single item', () => {
    render(<Breadcrumbs items={[{ label: 'Single Item' }]} />);

    expect(screen.getByText('Single Item')).toBeInTheDocument();
  });

  it('renders correctly with all items having hrefs', () => {
    const itemsWithHrefs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Category', href: '/products/category' },
    ];

    render(<Breadcrumbs items={itemsWithHrefs} />);

    itemsWithHrefs.forEach((item) => {
      const link = screen.getByRole('link', { name: item.label });
      expect(link).toHaveAttribute('href', item.href);
    });
  });

  it('renders correctly with no items having hrefs', () => {
    const itemsWithoutHrefs: BreadcrumbItem[] = [
      { label: 'Level 1' },
      { label: 'Level 2' },
      { label: 'Level 3' },
    ];

    render(<Breadcrumbs items={itemsWithoutHrefs} />);

    itemsWithoutHrefs.forEach((item) => {
      const span = screen.getByText(item.label);
      expect(span.tagName).toBe('SPAN');
    });
  });

  it('has correct accessibility structure', () => {
    render(<Breadcrumbs items={mockItems} />);

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('applies hover styles to links', () => {
    render(<Breadcrumbs items={mockItems} />);

    const serversLink = screen.getByRole('link', { name: 'Servers' });
    expect(serversLink).toHaveClass('hover:text-foreground', 'transition-colors');
  });

  it('renders with empty items array', () => {
    const { container } = render(<Breadcrumbs items={[]} />);

    // Should only render the home icon
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/');
  });
});
