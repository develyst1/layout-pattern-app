import { useState } from 'react';
import { parseTemplateFile } from '@shared/contract';
import { MAX_CANVAS_SIZE, MIN_CANVAS_SIZE, useDesignerStore } from '@/store/designerStore';
import { th } from '@/i18n/th';

/** Which §7 message a failed save / load shows. Never the raw English `detail`. */
type IoErrorKey = 'error.saveFailed' | 'error.loadFailed' | 'error.fileUnreadable';

/**
 * SPEC-001 §5 — template name, canvas size, add slot, save, load.
 *
 * Save and load go through `window.api` (SPEC-001 §4) and nothing else: the
 * renderer never touches the filesystem, and every dialog string is passed *into*
 * the call from `src/i18n/th.ts`. The English `detail` / `reason` that comes back
 * is developer-facing — it is logged, never rendered.
 */
export function Toolbar(): JSX.Element {
  const templateName = useDesignerStore((state) => state.templateName);
  const setTemplateName = useDesignerStore((state) => state.setTemplateName);
  const canvasWidth = useDesignerStore((state) => state.canvasWidth);
  const canvasHeight = useDesignerStore((state) => state.canvasHeight);
  const setCanvasSize = useDesignerStore((state) => state.setCanvasSize);
  const addSlot = useDesignerStore((state) => state.addSlot);
  const toTemplateFile = useDesignerStore((state) => state.toTemplateFile);
  const replaceAll = useDesignerStore((state) => state.replaceAll);

  const [ioErrorKey, setIoErrorKey] = useState<IoErrorKey | null>(null);

  // REQ-001 Requirement 14 / A10: no name -> the control is disabled outright, so
  // the dialog can never open. No warning text — the human chose the disabled
  // control *instead of* a message.
  const canSave = templateName.trim() !== '';

  const handleSave = async (): Promise<void> => {
    setIoErrorKey(null);
    const result = await window.api.saveTemplate(toTemplateFile(), {
      dialogTitle: th['dialog.save.title'],
      fileTypeLabel: th['dialog.fileTypeLabel'],
      defaultFileName: `${templateName.trim()}.json`,
    });
    if (result.status === 'error') {
      console.error(`saveTemplate ${result.code}: ${result.detail}`);
      setIoErrorKey('error.saveFailed');
    }
    // 'saved' -> nothing else happens (no toast is specified); 'canceled' -> no-op.
  };

  const handleLoad = async (): Promise<void> => {
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
    // Validation exists once, in the shared contract — the renderer calls it here.
    const parsed = parseTemplateFile(result.content);
    if (!parsed.ok) {
      console.error(`parseTemplateFile rejected the file: ${parsed.reason}`);
      setIoErrorKey('error.fileUnreadable');
      return;
    }
    // Replaces the whole design, never merges; zIndex and padded names are
    // repaired inside `replaceAll` (SPEC-001 §3 / §9 A-11).
    replaceAll(parsed.template);
  };

  return (
    <div className="flex flex-wrap items-end gap-4 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
      <label className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
        {th['toolbar.templateName']}
        <input
          type="text"
          value={templateName}
          onChange={(event) => {
            setTemplateName(event.target.value);
            setIoErrorKey(null);
          }}
          className="w-56 rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
        {th['toolbar.canvasWidth']}
        <input
          type="number"
          min={MIN_CANVAS_SIZE}
          max={MAX_CANVAS_SIZE}
          value={canvasWidth}
          onChange={(event) => setCanvasSize(Number(event.target.value), canvasHeight)}
          className="w-28 rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
        {th['toolbar.canvasHeight']}
        <input
          type="number"
          min={MIN_CANVAS_SIZE}
          max={MAX_CANVAS_SIZE}
          value={canvasHeight}
          onChange={(event) => setCanvasSize(canvasWidth, Number(event.target.value))}
          className="w-28 rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
      </label>

      <button
        type="button"
        onClick={addSlot}
        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        {th['toolbar.addSlot']}
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        className={
          canSave
            ? 'rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700'
            : 'cursor-not-allowed rounded bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-400 opacity-60 dark:bg-slate-700 dark:text-slate-500'
        }
      >
        {th['toolbar.save']}
      </button>

      <button
        type="button"
        onClick={handleLoad}
        className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        {th['toolbar.load']}
      </button>

      {ioErrorKey && (
        <p role="alert" className="w-full text-xs text-red-600 dark:text-red-400">
          {th[ioErrorKey]}
        </p>
      )}
    </div>
  );
}
