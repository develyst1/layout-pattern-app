import { useState } from 'react';
import { parseTemplateFile } from '@shared/contract';
import { decodePhotos } from '@/lib/photo';
import { useTemplateStore } from '@/store/useTemplateStore';
import { th } from '@/i18n/th';
import { UseTemplateCanvas } from './UseTemplateCanvas';
import { UseTemplateSlotPanel } from './UseTemplateSlotPanel';

/**
 * Which §7 message the single `role="alert"` line shows. Never the raw English
 * `detail` / `reason`. Exported because the per-row photo buttons live in
 * `UseTemplateSlotPanel` but write into *this* view's one message line
 * (SPEC-002 §6 "Messages": one line, at the end of the Use Template toolbar).
 */
export type UseTemplateMessageKey =
  | 'error.loadFailed'
  | 'error.fileUnreadable'
  | 'error.photoUnreadable'
  | 'error.photoLoadFailed';

/**
 * Use Template (SPEC-002 §6, TASK-007 + TASK-008). The layout mirrors the
 * designer tree in `App.tsx` — toolbar row, canvas in `<main>`, panel in a `w-72`
 * `<aside>` — so the two modes look like one app.
 *
 * Picking a template goes through **the existing** `window.api.openTemplate`
 * with the same dialog strings Load Template uses (B12); photos come in through
 * `window.api.pickImages`. The renderer never touches the filesystem, and the
 * English `reason` / `detail` that comes back is developer-facing — logged,
 * never rendered.
 */
export function UseTemplateView(): JSX.Element {
  const template = useTemplateStore((state) => state.template);
  const loadTemplate = useTemplateStore((state) => state.loadTemplate);
  const fillFromPhotos = useTemplateStore((state) => state.fillFromPhotos);

  const [messageKey, setMessageKey] = useState<UseTemplateMessageKey | null>(null);

  const handlePickTemplate = async (): Promise<void> => {
    setMessageKey(null);
    const result = await window.api.openTemplate({
      dialogTitle: th['dialog.open.title'],
      fileTypeLabel: th['dialog.fileTypeLabel'],
    });
    if (result.status === 'canceled') {
      return;
    }
    if (result.status === 'error') {
      console.error(`openTemplate ${result.code}: ${result.detail}`);
      setMessageKey('error.loadFailed');
      return;
    }
    const parsed = parseTemplateFile(result.content);
    if (!parsed.ok) {
      // B10: a bad file changes nothing — the template and photos already
      // loaded stay exactly as they were.
      console.error(`parseTemplateFile rejected the file: ${parsed.reason}`);
      setMessageKey('error.fileUnreadable');
      return;
    }
    loadTemplate(parsed.template);
  };

  // Req 4b / 17: several photos at once. The whole batch is gated and decoded
  // before any of it is placed (B-4 / B-11); `fillFromPhotos` then fills the
  // empty slots top-most first and silently revokes whatever it did not use.
  const handlePickManyPhotos = async (): Promise<void> => {
    setMessageKey(null);
    const result = await window.api.pickImages({
      dialogTitle: th['dialog.pickPhotos.title'],
      fileTypeLabel: th['dialog.photoTypeLabel'],
      multiple: true,
    });
    if (result.status === 'canceled') {
      return;
    }
    if (result.status === 'error') {
      console.error(`pickImages ${result.code}: ${result.detail}`);
      setMessageKey('error.photoLoadFailed');
      return;
    }
    const decoded = await decodePhotos(result.images);
    if (decoded === null) {
      // Every URL of that batch is already revoked and nothing is placed.
      setMessageKey('error.photoUnreadable');
      return;
    }
    fillFromPhotos(decoded);
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

        <button
          type="button"
          onClick={handlePickManyPhotos}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {th['useTemplate.pickManyPhotos']}
        </button>

        {template && (
          <p className="flex min-w-0 items-baseline gap-2 text-xs text-slate-600 dark:text-slate-300">
            {th['useTemplate.currentTemplate']}
            <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
              {template.name}
            </span>
          </p>
        )}

        {messageKey && (
          <p role="alert" className="w-full text-xs text-red-600 dark:text-red-400">
            {th[messageKey]}
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
          <UseTemplateSlotPanel onMessage={setMessageKey} />
        </aside>
      </div>
    </>
  );
}
