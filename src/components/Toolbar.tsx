import { MAX_CANVAS_SIZE, MIN_CANVAS_SIZE, useDesignerStore } from '@/store/designerStore';
import { th } from '@/i18n/th';

/** SPEC-001 §5 "Canvas size" + "Add slot". Save / load / dark mode arrive in TASK-004. */
export function Toolbar(): JSX.Element {
  const canvasWidth = useDesignerStore((state) => state.canvasWidth);
  const canvasHeight = useDesignerStore((state) => state.canvasHeight);
  const setCanvasSize = useDesignerStore((state) => state.setCanvasSize);
  const addSlot = useDesignerStore((state) => state.addSlot);

  return (
    <div className="flex flex-wrap items-end gap-4 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
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
    </div>
  );
}
