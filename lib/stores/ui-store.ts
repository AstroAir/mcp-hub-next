/**
 * UI Store - Manages UI state (modals, loading, errors)
 */

import { create } from 'zustand';
import type { UIStoreState } from '@/lib/types';

export const useUIStore = create<UIStoreState>((set) => ({
  isServerFormOpen: false,
  isServerDetailOpen: false,
  selectedServerId: null,
  isLoading: {},
  errors: {},

  openServerForm: () => set({ isServerFormOpen: true }),
  
  closeServerForm: () => set({ isServerFormOpen: false }),

  openServerDetail: (serverId: string) =>
    set({ isServerDetailOpen: true, selectedServerId: serverId }),

  closeServerDetail: () =>
    set({ isServerDetailOpen: false, selectedServerId: null }),

  setLoading: (key: string, loading: boolean) =>
    set((state) => ({
      isLoading: { ...state.isLoading, [key]: loading },
    })),

  setError: (key: string, error: string) =>
    set((state) => ({
      errors: { ...state.errors, [key]: error },
    })),

  clearError: (key: string) =>
    set((state) => ({
      errors: (() => {
        const rest = { ...state.errors };
        delete rest[key];
        return rest;
      })(),
    })),

  clearAllErrors: () => set({ errors: {} }),
}));

