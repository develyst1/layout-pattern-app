import { useEffect, type ReactNode } from 'react';
import { useUiStore } from '@/store/uiStore';
import { th } from '@/i18n/th';

/**
 * The app shell (SPEC-001 §5 "Modes" / "Dark mode", TASK-004):
 * a two-entry mode bar plus the dark-mode toggle, wrapped around whatever the
 * active mode renders.
 *
 * `Use Template` is deliberately a **disabled** entry carrying
 * `mode.useTemplate.badge` — REQ-001 A6 wants it visible and marked unavailable,
 * and clicking it must do nothing rather than navigate anywhere.
 */
export function AppShell({ children }: { children: ReactNode }): JSX.Element {
  const mode = useUiStore((state) => state.mode);
  const setMode = useUiStore((state) => state.setMode);
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);

  // The window title is a user-facing string, so it is set from the renderer and
  // never from `electron/main.ts` or `index.html` (SPEC-001 §1 keeps every Thai
  // string in one place; TASK-003 §Review N1).
  useEffect(() => {
    document.title = th['app.windowTitle'];
  }, []);

  // SPEC-001 §5 "Dark mode": the `dark` class lives on <html>, in memory only.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="flex h-full flex-col bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <nav className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => setMode('designer')}
          aria-current={mode === 'designer' ? 'page' : undefined}
          className={
            mode === 'designer'
              ? 'rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white'
              : 'rounded px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700'
          }
        >
          {th['mode.designer']}
        </button>

        <button
          type="button"
          disabled
          aria-disabled="true"
          className="flex cursor-not-allowed items-center gap-2 rounded px-3 py-1.5 text-sm font-medium text-slate-400 opacity-60 dark:text-slate-500"
        >
          {th['mode.useTemplate']}
          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-normal text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {th['mode.useTemplate.badge']}
          </span>
        </button>

        <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={theme === 'dark'}
            onChange={toggleTheme}
            className="h-4 w-4 cursor-pointer"
          />
          {th['toolbar.darkMode']}
        </label>
      </nav>

      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
