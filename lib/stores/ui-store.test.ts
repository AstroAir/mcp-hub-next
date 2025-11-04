import { act } from '@testing-library/react';
import { useUIStore } from './ui-store';

// Zustand testing helper: reset store between tests
const resetStore = () => {
  const initial = {
    isServerFormOpen: false,
    isServerDetailOpen: false,
    selectedServerId: null as string | null,
    isLoading: {} as Record<string, boolean>,
    errors: {} as Record<string, string>,
  };
  useUIStore.setState(initial);
};

describe('ui-store', () => {
  beforeEach(() => resetStore());

  it('opens and closes server form', () => {
    expect(useUIStore.getState().isServerFormOpen).toBe(false);
    act(() => useUIStore.getState().openServerForm());
    expect(useUIStore.getState().isServerFormOpen).toBe(true);
    act(() => useUIStore.getState().closeServerForm());
    expect(useUIStore.getState().isServerFormOpen).toBe(false);
  });

  it('opens and closes server detail with selection', () => {
    act(() => useUIStore.getState().openServerDetail('id1'));
    expect(useUIStore.getState().isServerDetailOpen).toBe(true);
    expect(useUIStore.getState().selectedServerId).toBe('id1');
    act(() => useUIStore.getState().closeServerDetail());
    expect(useUIStore.getState().isServerDetailOpen).toBe(false);
    expect(useUIStore.getState().selectedServerId).toBeNull();
  });

  it('tracks loading and errors, and clears', () => {
    act(() => useUIStore.getState().setLoading('fetch', true));
    expect(useUIStore.getState().isLoading.fetch).toBe(true);

    act(() => useUIStore.getState().setError('fetch', 'oops'));
    expect(useUIStore.getState().errors.fetch).toBe('oops');

    act(() => useUIStore.getState().clearError('fetch'));
    expect(useUIStore.getState().errors.fetch).toBeUndefined();

    act(() => useUIStore.getState().setError('x', 'e'));
    act(() => useUIStore.getState().clearAllErrors());
    expect(useUIStore.getState().errors).toEqual({});
  });
});
