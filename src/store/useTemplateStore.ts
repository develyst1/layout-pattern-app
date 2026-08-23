import { create } from 'zustand';
import type { TemplateFile } from '@shared/contract';
import { normalizeTemplate } from '@/lib/template';

/**
 * Use Template state (SPEC-002 §6, TASK-007).
 *
 * **SA call B-5**: this store is completely independent of `designerStore` — it
 * never reads it and never writes it. The user picks a `.json` file from disk;
 * whatever the designer happens to hold is irrelevant. Both stores are plain
 * in-memory stores that live for the app session, so switching modes destroys
 * nothing.
 */

/** One photo placed in one slot. `image` is already decoded and ready to draw. */
export interface PlacedPhoto {
  objectUrl: string;
  image: HTMLImageElement;
  fileName: string;
}

export interface TemplateState {
  template: TemplateFile | null;
  /** Keyed by slot id. Filled by TASK-008; always empty in TASK-007. */
  photos: Record<string, PlacedPhoto>;

  loadTemplate: (t: TemplateFile) => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  template: null,
  photos: {},

  // SPEC-002 §6 "Pick a template": replaces the whole Use Template state, never
  // merges. Every photo already placed is dropped and its object URL revoked —
  // slot ids from a different file are meaningless.
  //
  // The revoke loop is written now, while `photos` is always empty, so TASK-008
  // does not have to remember to add it (SPEC-002 §6 "Decoding": *every* path
  // that drops a photo revokes its URL).
  loadTemplate: (t) => {
    for (const photo of Object.values(get().photos)) {
      URL.revokeObjectURL(photo.objectUrl);
    }
    set({ template: normalizeTemplate(t), photos: {} });
  },
}));
