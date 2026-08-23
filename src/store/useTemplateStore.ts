import { create } from 'zustand';
import type { TemplateFile } from '@shared/contract';
import { normalizeTemplate } from '@/lib/template';

/**
 * Use Template state (SPEC-002 §6, TASK-007 + TASK-008).
 *
 * **SA call B-5**: this store is completely independent of `designerStore` — it
 * never reads it and never writes it. The user picks a `.json` file from disk;
 * whatever the designer happens to hold is irrelevant. Both stores are plain
 * in-memory stores that live for the app session, so switching modes destroys
 * nothing.
 *
 * **Object URLs are owned here.** Every path that drops a photo — replace,
 * remove, re-pick a template, surplus in a multi-fill — revokes its object URL
 * exactly once (SPEC-002 §6 "Decoding", §8). A photo that leaves the store and
 * is not revoked is a leak.
 */

/** One photo placed in one slot. `image` is already decoded and ready to draw. */
export interface PlacedPhoto {
  objectUrl: string;
  image: HTMLImageElement;
  fileName: string;
}

export interface TemplateState {
  template: TemplateFile | null;
  /** Keyed by slot id. */
  photos: Record<string, PlacedPhoto>;

  loadTemplate: (t: TemplateFile) => void;
  setPhoto: (slotId: string, photo: PlacedPhoto) => void;
  removePhoto: (slotId: string) => void;
  fillFromPhotos: (photos: PlacedPhoto[]) => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  template: null,
  photos: {},

  // SPEC-002 §6 "Pick a template": replaces the whole Use Template state, never
  // merges. Every photo already placed is dropped and its object URL revoked —
  // slot ids from a different file are meaningless.
  loadTemplate: (t) => {
    for (const photo of Object.values(get().photos)) {
      URL.revokeObjectURL(photo.objectUrl);
    }
    set({ template: normalizeTemplate(t), photos: {} });
  },

  // Req 13 / B16: one slot at a time, deliberately replacing whatever is there.
  // The replaced photo's URL is revoked here, as it leaves the store.
  setPhoto: (slotId, photo) => {
    const replaced = get().photos[slotId];
    if (replaced) {
      URL.revokeObjectURL(replaced.objectUrl);
    }
    set((state) => ({ photos: { ...state.photos, [slotId]: photo } }));
  },

  // Req 16 / B20: the slot goes empty again and the preview draws its rectangle
  // and name once more. Removing from an already-empty slot is a no-op.
  removePhoto: (slotId) => {
    const removed = get().photos[slotId];
    if (!removed) {
      return;
    }
    URL.revokeObjectURL(removed.objectUrl);
    set((state) => {
      const next = { ...state.photos };
      delete next[slotId];
      return { photos: next };
    });
  },

  /**
   * The several-at-once path (Req 4b, 17 / REQ-002 Q11 = ก, *"เฉพาะช่องว่าง"*).
   *
   * Walk the slots in **on-screen list order (top-most first)** — the reverse of
   * the store's back-most-first array, which is exactly what
   * `UseTemplateSlotPanel` shows — and give the next photo of the batch to each
   * slot **that has no photo**. A slot that already holds one is **skipped, never
   * overwritten**: replacing is a deliberate, per-slot act.
   *
   * Photos left over when the empty slots run out are **discarded silently** —
   * no notice, no count, no message (Q10 = ก / B21) — and the call still
   * succeeds. Their object URLs *do* exist, because the whole batch is decoded
   * before any of it is placed (SA call B-11), so releasing them is this
   * function's job: it revokes **exactly** the URLs of the photos it did not use.
   *
   * A batch with zero empty slots to fill is legal: everything is surplus,
   * everything is revoked, nothing changes on screen and nothing is shown.
   */
  fillFromPhotos: (photos) => {
    const state = get();
    const topMostFirst = [...(state.template?.slots ?? [])].reverse();
    const next = { ...state.photos };

    let used = 0;
    for (const slot of topMostFirst) {
      if (used >= photos.length) {
        break;
      }
      if (next[slot.id]) {
        continue;
      }
      next[slot.id] = photos[used];
      used += 1;
    }

    for (const surplus of photos.slice(used)) {
      URL.revokeObjectURL(surplus.objectUrl);
    }
    set({ photos: next });
  },
}));
