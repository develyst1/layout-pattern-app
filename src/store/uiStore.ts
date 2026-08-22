import { create } from 'zustand';

/**
 * Shell state: which mode is active and which theme is on (SPEC-001 §5
 * "Modes" / "Dark mode", TASK-004).
 *
 * Both are **in-memory only** — nothing here is persisted or saved into a
 * template file. `useTemplate` is out of scope for REQ-001: the entry exists and
 * is visibly disabled (A6), so `setMode` is never called with it today; the
 * union keeps the shell honest for when that mode arrives.
 */
export type AppMode = 'designer' | 'useTemplate';
export type Theme = 'light' | 'dark';

export interface UiState {
  mode: AppMode;
  theme: Theme;
  setMode: (mode: AppMode) => void;
  toggleTheme: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  mode: 'designer',
  theme: 'light',

  setMode: (mode) => set({ mode }),

  // The `dark` class on <html> is applied by AppShell's effect, so the store
  // stays a plain state container and the DOM touch happens in one place.
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
}));
