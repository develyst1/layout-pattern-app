import { useState } from 'react';
import { parseTemplateFile } from '@shared/contract';
import { composeTemplateToCanvas } from '@/lib/compose';
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
  | 'error.photoLoadFailed'
  | 'error.requiredSlotEmpty'
  | 'error.exportFailed';

/**
 * The whole state of that one line. `slots` fills the single `{slots}`
 * placeholder `error.requiredSlotEmpty` carries (SPEC-002 §7 / SA call B-9) —
 * one `String.replace` at render time, and nothing anywhere ever branches on a
 * message's *text*.
 */
interface UseTemplateMessage {
  key: UseTemplateMessageKey;
  slots?: string;
}

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
  const photos = useTemplateStore((state) => state.photos);
  const loadTemplate = useTemplateStore((state) => state.loadTemplate);
  const fillFromPhotos = useTemplateStore((state) => state.fillFromPhotos);

  const [message, setMessage] = useState<UseTemplateMessage | null>(null);
  /** Every message except the one with a placeholder is just its key. */
  const showMessage = (key: UseTemplateMessageKey | null): void => {
    setMessage(key === null ? null : { key });
  };

  const handlePickTemplate = async (): Promise<void> => {
    showMessage(null);
    const result = await window.api.openTemplate({
      dialogTitle: th['dialog.open.title'],
      fileTypeLabel: th['dialog.fileTypeLabel'],
    });
    if (result.status === 'canceled') {
      return;
    }
    if (result.status === 'error') {
      console.error(`openTemplate ${result.code}: ${result.detail}`);
      showMessage('error.loadFailed');
      return;
    }
    const parsed = parseTemplateFile(result.content);
    if (!parsed.ok) {
      // B10: a bad file changes nothing — the template and photos already
      // loaded stay exactly as they were.
      console.error(`parseTemplateFile rejected the file: ${parsed.reason}`);
      showMessage('error.fileUnreadable');
      return;
    }
    loadTemplate(parsed.template);
  };

  // Req 4b / 17: several photos at once. The whole batch is gated and decoded
  // before any of it is placed (B-4 / B-11); `fillFromPhotos` then fills the
  // empty slots top-most first and silently revokes whatever it did not use.
  const handlePickManyPhotos = async (): Promise<void> => {
    showMessage(null);
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
      showMessage('error.photoLoadFailed');
      return;
    }
    const decoded = await decodePhotos(result.images);
    if (decoded === null) {
      // Every URL of that batch is already revoked and nothing is placed.
      showMessage('error.photoUnreadable');
      return;
    }
    fillFromPhotos(decoded);
  };

  // SPEC-002 §6 "Generate". The button is never disabled (SA call B-7): Req 14
  // wants a message that *names* the problem, and a disabled button cannot.
  const handleGenerate = async (): Promise<void> => {
    showMessage(null);
    if (!template) {
      return;
    }

    // On-screen list order — top-most first, the reverse of the store's
    // back-most-first array, the same order `UseTemplateSlotPanel` shows.
    const missing = [...template.slots]
      .reverse()
      .filter((slot) => slot.required && !photos[slot.id])
      .map((slot) => slot.name);
    if (missing.length > 0) {
      // B17: no dialog and no file — this stops here.
      setMessage({ key: 'error.requiredSlotEmpty', slots: missing.join(', ') });
      return;
    }

    const canvas = composeTemplateToCanvas(template, photos);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
    if (!blob) {
      console.error('canvas.toBlob produced no PNG blob');
      showMessage('error.exportFailed');
      return;
    }
    const bytes = new Uint8Array(await blob.arrayBuffer());

    const result = await window.api.savePng(bytes, {
      dialogTitle: th['dialog.exportPng.title'],
      fileTypeLabel: th['dialog.pngTypeLabel'],
      defaultFileName: `${template.name}.png`,
    });
    if (result.status === 'error') {
      console.error(`savePng ${result.code}: ${result.detail}`);
      showMessage('error.exportFailed');
      return;
    }
    // `saved` shows no confirmation at all (B-8) and `canceled` is a no-op (B7).
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
          <button
            type="button"
            onClick={handlePickManyPhotos}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {th['useTemplate.pickManyPhotos']}
          </button>
        )}

        {template && (
          <button
            type="button"
            onClick={handleGenerate}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            {th['useTemplate.generate']}
          </button>
        )}

        {template && (
          <p className="flex min-w-0 items-baseline gap-2 text-xs text-slate-600 dark:text-slate-300">
            {th['useTemplate.currentTemplate']}
            <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
              {template.name}
            </span>
          </p>
        )}

        {message && (
          <p role="alert" className="w-full text-xs text-red-600 dark:text-red-400">
            {th[message.key].replace('{slots}', message.slots ?? '')}
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
          <UseTemplateSlotPanel onMessage={showMessage} />
        </aside>
      </div>
    </>
  );
}
