import { renderHook, act } from '@testing-library/react';
import { useCommandPalette } from './use-command-palette';

describe('useCommandPalette', () => {
  it('opens, closes, and toggles', () => {
    const { result } = renderHook(() => useCommandPalette());
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
  });
});
