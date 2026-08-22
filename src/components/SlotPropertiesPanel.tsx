import { useEffect, useState } from 'react';
import { useDesignerStore } from '@/store/designerStore';
import { th } from '@/i18n/th';

/** Which §7 message a refused rename shows. Mapped from the store's reason code. */
type NameErrorKey = 'error.blankSlotName' | 'error.duplicateSlotName';

/**
 * SPEC-001 §5 "Rename": the name is committed on Enter or blur, never per
 * keystroke. A refusal reverts the input, leaves the store untouched and shows
 * the matching Thai message inline under the field — transient UI state only,
 * cleared on the next edit or when another slot is selected.
 */
export function SlotPropertiesPanel(): JSX.Element {
  const selectedSlotId = useDesignerStore((state) => state.selectedSlotId);
  const selectedSlot = useDesignerStore(
    (state) => state.slots.find((slot) => slot.id === state.selectedSlotId) ?? null,
  );
  const renameSlot = useDesignerStore((state) => state.renameSlot);
  const updateSlot = useDesignerStore((state) => state.updateSlot);

  const [draftName, setDraftName] = useState('');
  const [errorKey, setErrorKey] = useState<NameErrorKey | null>(null);

  useEffect(() => {
    setDraftName(selectedSlot?.name ?? '');
    setErrorKey(null);
    // Keyed on the selection, not the name: a refused rename must NOT reset the
    // draft here — the commit handler does the reverting.
  }, [selectedSlotId]);

  const commitName = (): void => {
    if (!selectedSlot || draftName === selectedSlot.name) {
      return;
    }
    const result = renameSlot(selectedSlot.id, draftName);
    if (result.ok) {
      setDraftName(draftName.trim());
      setErrorKey(null);
      return;
    }
    setDraftName(selectedSlot.name);
    setErrorKey(result.reason === 'blank' ? 'error.blankSlotName' : 'error.duplicateSlotName');
  };

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {th['props.heading']}
      </h2>

      {selectedSlot && (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
            {th['props.name']}
            <input
              type="text"
              value={draftName}
              onChange={(event) => {
                setDraftName(event.target.value);
                setErrorKey(null);
              }}
              onBlur={commitName}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  commitName();
                }
              }}
              className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </label>
          {errorKey && (
            <p role="alert" className="-mt-2 text-xs text-red-600 dark:text-red-400">
              {th[errorKey]}
            </p>
          )}

          <label className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
            {th['props.color']}
            <input
              type="color"
              value={selectedSlot.color}
              onChange={(event) =>
                updateSlot(selectedSlot.id, { color: event.target.value.toLowerCase() })
              }
              className="h-8 w-16 cursor-pointer rounded border border-slate-300 dark:border-slate-600"
            />
          </label>
        </div>
      )}
    </section>
  );
}
