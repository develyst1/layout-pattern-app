import { useDesignerStore } from '@/store/designerStore';
import { th } from '@/i18n/th';

const ROW_BUTTON =
  'rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700 hover:bg-slate-100 ' +
  'dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700';

/** SPEC-001 §5 "Z-order": the list is ordered top-most first. */
export function SlotListPanel(): JSX.Element {
  const slots = useDesignerStore((state) => state.slots);
  const selectedSlotId = useDesignerStore((state) => state.selectedSlotId);
  const selectSlot = useDesignerStore((state) => state.selectSlot);
  const bringForward = useDesignerStore((state) => state.bringForward);
  const sendBackward = useDesignerStore((state) => state.sendBackward);
  const deleteSlot = useDesignerStore((state) => state.deleteSlot);

  // `slots` is kept back-most first by the store, so top-most first is its reverse.
  const topMostFirst = [...slots].reverse();

  return (
    <section className="flex min-h-0 flex-col">
      <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {th['panel.slotsHeading']}
      </h2>

      {topMostFirst.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{th['panel.empty']}</p>
      ) : (
        <ul className="flex min-h-0 flex-col gap-1 overflow-y-auto">
          {topMostFirst.map((slot) => (
            <li
              key={slot.id}
              className={`flex items-center gap-1 rounded border px-2 py-1 ${
                slot.id === selectedSlotId
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-transparent'
              }`}
            >
              <button
                type="button"
                onClick={() => selectSlot(slot.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left text-xs text-slate-800 dark:text-slate-100"
              >
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 rounded-sm border border-slate-400"
                  style={{ backgroundColor: slot.color }}
                />
                <span className="truncate">{slot.name}</span>
              </button>
              <button
                type="button"
                className={ROW_BUTTON}
                title={th['panel.bringForward']}
                aria-label={th['panel.bringForward']}
                onClick={() => bringForward(slot.id)}
              >
                &uarr;
              </button>
              <button
                type="button"
                className={ROW_BUTTON}
                title={th['panel.sendBackward']}
                aria-label={th['panel.sendBackward']}
                onClick={() => sendBackward(slot.id)}
              >
                &darr;
              </button>
              <button
                type="button"
                className={ROW_BUTTON}
                title={th['panel.delete']}
                aria-label={th['panel.delete']}
                onClick={() => deleteSlot(slot.id)}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
