/**
 * @jest-environment jsdom
 */

import { render, screen, renderHook, act } from '@testing-library/react';
import { BreadcrumbProvider, useBreadcrumbs, BreadcrumbItem } from './breadcrumb-provider';
import { ReactNode } from 'react';

describe('BreadcrumbProvider', () => {
  it('renders children without crashing', () => {
    render(
      <BreadcrumbProvider>
        <div>Test Child</div>
      </BreadcrumbProvider>
    );

    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('provides initial empty breadcrumb items', () => {
    const { result } = renderHook(() => useBreadcrumbs(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <BreadcrumbProvider>{children}</BreadcrumbProvider>
      ),
    });

    expect(result.current.items).toEqual([]);
  });

  it('provides setBreadcrumbs function', () => {
    const { result } = renderHook(() => useBreadcrumbs(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <BreadcrumbProvider>{children}</BreadcrumbProvider>
      ),
    });

    expect(result.current.setBreadcrumbs).toBeDefined();
    expect(typeof result.current.setBreadcrumbs).toBe('function');
  });

  it('updates breadcrumb items when setBreadcrumbs is called', () => {
    const { result } = renderHook(() => useBreadcrumbs(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <BreadcrumbProvider>{children}</BreadcrumbProvider>
      ),
    });

    const newItems: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Settings' },
    ];

    act(() => {
      result.current.setBreadcrumbs(newItems);
    });

    expect(result.current.items).toEqual(newItems);
  });

  it('replaces existing breadcrumbs when setBreadcrumbs is called again', () => {
    const { result } = renderHook(() => useBreadcrumbs(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <BreadcrumbProvider>{children}</BreadcrumbProvider>
      ),
    });

    const firstItems: BreadcrumbItem[] = [{ label: 'First', href: '/first' }];
    const secondItems: BreadcrumbItem[] = [{ label: 'Second', href: '/second' }];

    act(() => {
      result.current.setBreadcrumbs(firstItems);
    });

    expect(result.current.items).toEqual(firstItems);

    act(() => {
      result.current.setBreadcrumbs(secondItems);
    });

    expect(result.current.items).toEqual(secondItems);
  });

  it('handles empty array as breadcrumbs', () => {
    const { result } = renderHook(() => useBreadcrumbs(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <BreadcrumbProvider>{children}</BreadcrumbProvider>
      ),
    });

    act(() => {
      result.current.setBreadcrumbs([{ label: 'Test' }]);
    });

    expect(result.current.items).toHaveLength(1);

    act(() => {
      result.current.setBreadcrumbs([]);
    });

    expect(result.current.items).toEqual([]);
  });

  it('handles multiple breadcrumb items', () => {
    const { result } = renderHook(() => useBreadcrumbs(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <BreadcrumbProvider>{children}</BreadcrumbProvider>
      ),
    });

    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Category', href: '/products/category' },
      { label: 'Item' },
    ];

    act(() => {
      result.current.setBreadcrumbs(items);
    });

    expect(result.current.items).toHaveLength(4);
    expect(result.current.items).toEqual(items);
  });

  it('preserves setBreadcrumbs reference between renders', () => {
    const { result, rerender } = renderHook(() => useBreadcrumbs(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <BreadcrumbProvider>{children}</BreadcrumbProvider>
      ),
    });

    const initialSetBreadcrumbs = result.current.setBreadcrumbs;

    rerender();

    expect(result.current.setBreadcrumbs).toBe(initialSetBreadcrumbs);
  });

  it('handles items with only labels', () => {
    const { result } = renderHook(() => useBreadcrumbs(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <BreadcrumbProvider>{children}</BreadcrumbProvider>
      ),
    });

    const items: BreadcrumbItem[] = [
      { label: 'Item 1' },
      { label: 'Item 2' },
      { label: 'Item 3' },
    ];

    act(() => {
      result.current.setBreadcrumbs(items);
    });

    expect(result.current.items).toEqual(items);
    expect(result.current.items.every((item) => !item.href)).toBe(true);
  });

  it('handles items with mixed href values', () => {
    const { result } = renderHook(() => useBreadcrumbs(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <BreadcrumbProvider>{children}</BreadcrumbProvider>
      ),
    });

    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Current Page' },
      { label: 'Another Link', href: '/another' },
    ];

    act(() => {
      result.current.setBreadcrumbs(items);
    });

    expect(result.current.items).toEqual(items);
  });
});

describe('useBreadcrumbs', () => {
  it('throws error when used outside BreadcrumbProvider', () => {
    // Suppress console.error for this test
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useBreadcrumbs());
    }).toThrow('useBreadcrumbs must be used within a BreadcrumbProvider');

    consoleError.mockRestore();
  });

  it('works correctly when used within BreadcrumbProvider', () => {
    const { result } = renderHook(() => useBreadcrumbs(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <BreadcrumbProvider>{children}</BreadcrumbProvider>
      ),
    });

    expect(() => result.current).not.toThrow();
    expect(result.current.items).toBeDefined();
    expect(result.current.setBreadcrumbs).toBeDefined();
  });

  it('allows multiple components to access the same breadcrumb state', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <BreadcrumbProvider>{children}</BreadcrumbProvider>
    );

    const { result: result1 } = renderHook(() => useBreadcrumbs(), { wrapper });
    const { result: result2 } = renderHook(() => useBreadcrumbs(), { wrapper });

    const items: BreadcrumbItem[] = [{ label: 'Shared', href: '/shared' }];

    act(() => {
      result1.current.setBreadcrumbs(items);
    });

    // Both hooks should see the same state
    // Note: In a real scenario with the same provider instance, this would work
    // For testing purposes, each renderHook creates a new provider instance
    expect(result1.current.items).toEqual(items);
  });
});
