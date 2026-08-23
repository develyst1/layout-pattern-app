import { decodePhotos } from '@/lib/photo';
import { useTemplateStore } from '@/store/useTemplateStore';
import { th } from '@/i18n/th';
import type { UseTemplateMessageKey } from './UseTemplateView';

const MARKER =
  'shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal text-slate-600 ' +
  'dark:bg-slate-700 dark:text-slate-300';

/** The designer's row-button styling (`SlotListPanel`), copied, not re-invented. */
const ROW_BUTTON =
  'rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700 hover:bg-slate-100 ' +
  'dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700';

interface UseTemplateSlotPanelProps {
  /**
   * Writes the view's single `role="alert"` line (SPEC-002 §6 "Messages").
   * `null` clears it, which every pick does before it starts.
   */
  onMessage: (key: UseTemplateMessageKey | null) => void;
}

/**
 * The Use Template slot list (SPEC-002 §6). Ordered **top-most first** — the
 * reverse of the store's back-most-first array, identical to `SlotListPanel`,
 * which is what Req 4b's "the order the on-screen slot list shows them" means.
 *
 * Each row carries its own `useTemplate.pickPhoto` (Req 4a) and, once it holds a
 * photo, `useTemplate.removePhoto` (Req 16). A pick here is a **single**-file
 * pick that replaces whatever is in *that* slot (Req 13 / B16) — the toolbar's
 * multi-pick is the one that skips filled slots.
 */
export function UseTemplateSlotPanel({ onMessage }: UseTemplateSlotPanelProps): JSX.Element {
  const template = useTemplateStore((state) => state.template);
  const photos = useTemplateStore((state) => state.photos);
  const setPhoto = useTemplateStore((state) => state.setPhoto);
  const removePhoto = useTemplateStore((state) => state.removePhoto);

  const topMostFirst = [...(template?.slots ?? [])].reverse();

  const handlePickPhoto = async (slotId: string): Promise<void> => {
    onMessage(null);
    const result = await window.api.pickImages({
      dialogTitle: th['dialog.pickPhotos.title'],
      fileTypeLabel: th['dialog.photoTypeLabel'],
      multiple: false,
    });
    if (result.status === 'canceled') {
      return;
    }
    if (result.status === 'error') {
      console.error(`pickImages ${result.code}: ${result.detail}`);
      onMessage('error.photoLoadFailed');
      return;
    }
    const decoded = await decodePhotos(result.images);
    if (decoded === null) {
      // Every URL of that batch is already revoked and nothing is placed.
      onMessage('error.photoUnreadable');
      return;
    }
    const [photo, ...extra] = decoded;
    // `multiple: false` is contractually exactly one file. If the seam ever
    // handed back more, the extras would still be decoded object URLs nobody
    // owns — releasing them keeps "never leak one" true in every case.
    for (const unused of extra) {
      URL.revokeObjectURL(unused.objectUrl);
    }
    if (!photo) {
      return;
    }
    setPhoto(slotId, photo);
  };

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
              <button
                type="button"
                className={ROW_BUTTON}
                title={th['useTemplate.pickPhoto']}
                onClick={() => handlePickPhoto(slot.id)}
              >
                {th['useTemplate.pickPhoto']}
              </button>
              {photos[slot.id] && (
                <button
                  type="button"
                  className={ROW_BUTTON}
                  title={th['useTemplate.removePhoto']}
                  onClick={() => removePhoto(slot.id)}
                >
                  {th['useTemplate.removePhoto']}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
