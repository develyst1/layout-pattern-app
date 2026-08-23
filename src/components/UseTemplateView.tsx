import { useState } from 'react';
import { parseTemplateFile } from '@shared/contract';
import { useTemplateStore } from '@/store/useTemplateStore';
import { th } from '@/i18n/th';
import { UseTemplateCanvas } from './UseTemplateCanvas';
import { UseTemplateSlotPanel } from './UseTemplateSlotPanel';

/** Which §7 message a failed pick shows. Never the raw English `detail` / `reason`. */
type IoErrorKey = 'error.loadFailed' | 'error.fileUnreadable';

/**
 * Use Template (SPEC-002 §6, TASK-007). The layout mirrors the designer tree in
 * `App.tsx` — toolbar row, canvas in `<main>`, panel in a `w-72` `<aside>` — so
 * the two modes look like one app.
 *
 * Picking a template goes through **the existing** `window.api.openTemplate`
 * with the same dialog strings Load Template uses (B12): the renderer never
 * touches the filesystem, and the English `reason` / `detail` that comes back is
 * developer-facing — logged, never rendered.
 */
export function UseTemplateView(): JSX.Element {
  const template = useTemplateStore((state) => state.template);
  const loadTemplate = useTemplateStore((state) => state.loadTemplate);

  const [ioErrorKey, setIoErrorKey] = useState<IoErrorKey | null>(null);

  const handlePickTemplate = async (): Promise<void> => {
    setIoErrorKey(null);
    const result = await window.api.openTemplate({
      dialogTitle: th['dialog.open.title'],
      fileTypeLabel: th['dialog.fileTypeLabel'],
    });
    if (result.status === 'canceled') {
      return;
    }
    if (result.status === 'error') {
      console.error(`openTemplate ${result.code}: ${result.detail}`);
      setIoErrorKey('error.loadFailed');
      return;
    }
    const parsed = parseTemplateFile(result.content);
    if (!parsed.ok) {
      // B10: a bad file changes nothing — the template and photos already
      // loaded stay exactly as they were.
      console.error(`parseTemplateFile rejected the file: ${parsed.reason}`);
      setIoErrorKey('error.fileUnreadable');
      return;
    }
    loadTemplate(parsed.template);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          onClick={handlePickTemplate}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {th['useTemplate.pickTemplate']}
        </button>

        {template && (
          <p className="flex min-w-0 items-baseline gap-2 text-xs text-slate-600 dark:text-slate-300">
            {th['useTemplate.currentTemplate']}
            <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
              {template.name}
            </span>
          </p>
        )}

        {ioErrorKey && (
          <p role="alert" className="w-full text-xs text-red-600 dark:text-red-400">
            {th[ioErrorKey]}
          </p>
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1">
          {template ? (
            <UseTemplateCanvas />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-200 p-4 dark:bg-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {th['useTemplate.noTemplate']}
              </p>
            </div>
          )}
        </main>
        <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <UseTemplateSlotPanel />
        </aside>
      </div>
    </>
  );
}
