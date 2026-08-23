import type { SlotData, TemplateFile } from '@shared/contract';

/**
 * The two repairs SPEC-001 §3 / §9 A-11 puts on the **renderer** rather than on
 * `parseTemplateFile`: repairable input is the renderer's job to repair, not the
 * validator's to reject. They live here, in one copy, because both modes load
 * the same files — the Layout Designer through `designerStore.replaceAll` and
 * Use Template through `useTemplateStore.loadTemplate` (SPEC-002 §6).
 *
 * Moved out of `designerStore.ts` by TASK-007. **A move, not a redesign** — what
 * these functions do is unchanged, and the TASK's regression check is what says so.
 */

/**
 * SPEC-001 §3: `zIndex` is contiguous `0 … n-1`, `0` = back-most. Called after
 * every mutation, and it also leaves `slots` sorted back-most first, so array
 * order and paint order are the same thing everywhere downstream.
 */
export function normalizeZIndex(slots: SlotData[]): SlotData[] {
  return [...slots]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((slot, index) => (slot.zIndex === index ? slot : { ...slot, zIndex: index }));
}

/**
 * A loaded template, repaired: the template name and every slot name trimmed, and
 * the slots run through `normalizeZIndex`.
 *
 * A hand-edited file may be padded, and §5's rename path can never produce a
 * padded name, so an untrimmed load would leave a store in a state the UI itself
 * cannot reach (TASK-002 §Review N5). Trim only: blank names are already rejected
 * by the validator, so a trim can never empty a name here.
 */
export function normalizeTemplate(t: TemplateFile): TemplateFile {
  return {
    ...t,
    name: t.name.trim(),
    slots: normalizeZIndex(t.slots).map((slot) => ({ ...slot, name: slot.name.trim() })),
  };
}
