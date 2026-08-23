import { useTemplateStore } from '@/store/useTemplateStore';
import { th } from '@/i18n/th';

const MARKER =
  'shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal text-slate-600 ' +
  'dark:bg-slate-700 dark:text-slate-300';

/**
 * The Use Template slot list (SPEC-002 §6). Ordered **top-most first** — the
 * reverse of the store's back-most-first array, identical to `SlotListPanel`,
 * which is what Req 4b's "the order the on-screen slot list shows them" means.
 *
 * Read-only in TASK-007: the per-row photo buttons arrive with TASK-008.
 */
export function UseTemplateSlotPanel(): JSX.Element {
  const template = useTemplateStore((state) => state.template);
  const photos = useTemplateStore((state) => state.photos);

  const topMostFirst = [...(template?.slots ?? [])].reverse();

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
              className="flex items-center gap-2 rounded border border-transparent px-2 py-1"
            >
              <span
                aria-hidden="true"
                className="h-3 w-3 shrink-0 rounded-sm border border-slate-400"
                style={{ backgroundColor: slot.color }}
              />
              <span className="min-w-0 flex-1 truncate text-xs text-slate-800 dark:text-slate-100">
                {slot.name}
              </span>
              {/* Two independent marks (SPEC-002 §7): "required" is a property of
                  the slot, "no photo yet" is a property of this session. */}
              {slot.required && <span className={MARKER}>{th['useTemplate.slotRequired']}</span>}
              {!photos[slot.id] && <span className={MARKER}>{th['useTemplate.slotEmpty']}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
