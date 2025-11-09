import { act, renderHook, waitFor } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

describe("useIsMobile", () => {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    listeners.clear();
    window.matchMedia = jest.fn().mockImplementation((query: string) => {
      const mql = {
        matches: window.innerWidth < 768,
        media: query,
        onchange: null,
        addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.add(listener);
        },
        removeEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.delete(listener);
        },
        addListener: (listener: (event: MediaQueryListEvent) => void) => {
          listeners.add(listener);
        },
        removeListener: (listener: (event: MediaQueryListEvent) => void) => {
          listeners.delete(listener);
        },
        dispatchEvent: () => false,
      } as MediaQueryList;
      return mql;
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("tracks viewport width changes", async () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    act(() => {
      window.innerWidth = 640;
  listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("returns true when initialized on small screens", async () => {
    window.innerWidth = 500;
    const { result } = renderHook(() => useIsMobile());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});
