import { create } from 'zustand';
import { TEMPLATE_FORMAT_VERSION, type SlotData, type TemplateFile } from '@shared/contract';
// SPEC-002 §6 / TASK-007: both load repairs now live in one place, shared with
// the Use Template store. `normalizeZIndex` used to be defined in this file.
import { normalizeTemplate, normalizeZIndex } from '@/lib/template';

// SPEC-001 §5 "Canvas size" / §9 A-2.
export const DEFAULT_CANVAS_WIDTH = 1080;
export const DEFAULT_CANVAS_HEIGHT = 1920;
export const MIN_CANVAS_SIZE = 1;
export const MAX_CANVAS_SIZE = 10000;

// SPEC-001 §5 "Move / resize".
export const MIN_SLOT_SIZE = 20;

// SPEC-001 §5 "Add slot".
const NEW_SLOT_SIZE = 300;
const CASCADE_ORIGIN = 40;
const CASCADE_STEP = 32;
const CASCADE_WRAP = 10;

/**
 * The 8-colour rotation of SPEC-001 §5 "Add slot". The SPEC fixes the *shape*
 * (eight colours, opaque lower-case `#rrggbb` per §9 A-1) but not the values;
 * the first entry is the one shown in the §3 example. See TASK-003 §Questions.
 */
export const SLOT_COLORS = [
  '#4f8ef7',
  '#f76f4f',
  '#4fbf6f',
  '#b14ff7',
  '#f7c94f',
  '#4fd4d4',
  '#f74f97',
  '#7f8c9a',
] as const;

/** Why a rename was refused. The UI maps this to a §7 key — never to a message. */
export type RenameRejection = 'blank' | 'duplicate';
export type RenameResult = { ok: true } | { ok: false; reason: RenameRejection };

/** Geometry and colour may be patched freely; name and zIndex have their own actions. */
export type SlotPatch = Partial<Pick<SlotData, 'x' | 'y' | 'width' | 'height' | 'color'>>;

/**
 * SPEC-001 §9 A-6: names are compared **trimmed and case-insensitively**, so
 * `Slot 1` collides with `slot 1`. Only the comparison folds case — the stored
 * name keeps the casing the user typed.
 */
function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * SPEC-001 §5 "Add slot" / REQ-001 A17: the lowest `slot N` from 1 up that is not
 * already in use, "in use" under the same case-insensitive rule as the rename
 * check — so with a slot the user renamed to `Slot 3`, the generator skips 3.
 */
function nextSlotName(slots: SlotData[]): string {
  const used = new Set(slots.map((slot) => nameKey(slot.name)));
  let n = 1;
  while (used.has(`slot ${n}`)) {
    n += 1;
  }
  return `slot ${n}`;
}

function clampCanvasSize(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_CANVAS_SIZE;
  }
  return Math.min(MAX_CANVAS_SIZE, Math.max(MIN_CANVAS_SIZE, Math.round(value)));
}

/** Moves `id` one step along the paint order. `delta` is +1 forward, -1 backward. */
function swapWithNeighbour(slots: SlotData[], id: string, delta: 1 | -1): SlotData[] {
  const ordered = normalizeZIndex(slots);
  const index = ordered.findIndex((slot) => slot.id === id);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= ordered.length) {
    return ordered;
  }
  const swapped = [...ordered];
  const moved = swapped[index];
  swapped[index] = swapped[target];
  swapped[target] = moved;
  return normalizeZIndex(swapped.map((slot, i) => ({ ...slot, zIndex: i })));
}

export interface DesignerState {
  canvasWidth: number;
  canvasHeight: number;
  templateName: string;
  slots: SlotData[];
  selectedSlotId: string | null;

  addSlot: () => void;
  updateSlot: (id: string, patch: SlotPatch) => void;
  renameSlot: (id: string, name: string) => RenameResult;
  setSlotRequired: (id: string, required: boolean) => void;
  deleteSlot: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  setCanvasSize: (width: number, height: number) => void;
  setTemplateName: (name: string) => void;
  selectSlot: (id: string | null) => void;
  replaceAll: (template: TemplateFile) => void;
  toTemplateFile: () => TemplateFile;
}

export const useDesignerStore = create<DesignerState>((set, get) => ({
  canvasWidth: DEFAULT_CANVAS_WIDTH,
  canvasHeight: DEFAULT_CANVAS_HEIGHT,
  templateName: '',
  slots: [],
  selectedSlotId: null,

  addSlot: () =>
    set((state) => {
      const k = state.slots.length % CASCADE_WRAP;
      const slot: SlotData = {
        id: crypto.randomUUID(),
        name: nextSlotName(state.slots),
        x: CASCADE_ORIGIN + CASCADE_STEP * k,
        y: CASCADE_ORIGIN + CASCADE_STEP * k,
        width: Math.min(NEW_SLOT_SIZE, state.canvasWidth),
        height: Math.min(NEW_SLOT_SIZE, state.canvasHeight),
        zIndex: state.slots.length,
        color: SLOT_COLORS[state.slots.length % SLOT_COLORS.length],
        // REQ-002 Req 15d: a new slot starts required, so a slot whose control the
        // user never touches behaves exactly like an old template's slot.
        required: true,
      };
      return {
        slots: normalizeZIndex([...state.slots, slot]),
        selectedSlotId: slot.id,
      };
    }),

  updateSlot: (id, patch) =>
    set((state) => ({
      slots: normalizeZIndex(
        state.slots.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)),
      ),
    })),

  // SPEC-001 §5 "Rename": blank is checked FIRST, so an empty field never reports
  // a collision. Both refusals leave the store untouched; the caller reverts the
  // input and shows the matching §7 message.
  renameSlot: (id, name) => {
    const trimmed = name.trim();
    if (trimmed === '') {
      return { ok: false, reason: 'blank' };
    }
    const { slots } = get();
    const key = nameKey(trimmed);
    if (slots.some((slot) => slot.id !== id && nameKey(slot.name) === key)) {
      return { ok: false, reason: 'duplicate' };
    }
    set({
      slots: slots.map((slot) => (slot.id === id ? { ...slot, name: trimmed } : slot)),
    });
    return { ok: true };
  },

  // REQ-002 Req 15. Deliberately NOT carried on `SlotPatch`: that patch is the
  // geometry/colour path used by drag and transform, and this flag has no
  // business travelling on it.
  setSlotRequired: (id, required) =>
    set((state) => ({
      slots: state.slots.map((slot) => (slot.id === id ? { ...slot, required } : slot)),
    })),

  deleteSlot: (id) =>
    set((state) => ({
      slots: normalizeZIndex(state.slots.filter((slot) => slot.id !== id)),
      selectedSlotId: null,
    })),

  bringForward: (id) => set((state) => ({ slots: swapWithNeighbour(state.slots, id, 1) })),

  sendBackward: (id) => set((state) => ({ slots: swapWithNeighbour(state.slots, id, -1) })),

  // SPEC-001 §9 A-3: resizing the canvas never moves or clamps existing slots.
  setCanvasSize: (width, height) =>
    set({ canvasWidth: clampCanvasSize(width), canvasHeight: clampCanvasSize(height) }),

  setTemplateName: (name) => set({ templateName: name }),

  selectSlot: (id) => set({ selectedSlotId: id }),

  // SPEC-001 §5 "Load": replaces the whole designer state, never merges.
  //
  // The two repairs (`normalizeZIndex` + trimming the template name and every
  // slot name) moved to `@/lib/template` in TASK-007 so Use Template shares one
  // copy. `normalizeTemplate` is exactly what used to be written out here — see
  // that file for the SPEC-001 §3 / §9 A-11 reasoning.
  replaceAll: (template) => {
    const normalized = normalizeTemplate(template);
    set({
      canvasWidth: normalized.canvasWidth,
      canvasHeight: normalized.canvasHeight,
      templateName: normalized.name,
      slots: normalized.slots,
      selectedSlotId: null,
    });
  },

  toTemplateFile: () => {
    const { templateName, canvasWidth, canvasHeight, slots } = get();
    return {
      formatVersion: TEMPLATE_FORMAT_VERSION,
      // R1 (TASK-004 R1): trim where the value leaves the app, so save -> load -> save is
      // idempotent. The store still keeps exactly what the user typed.
      name: templateName.trim(),
      canvasWidth,
      canvasHeight,
      slots: normalizeZIndex(slots).map((slot) => ({
        ...slot,
        x: Math.round(slot.x),
        y: Math.round(slot.y),
        width: Math.round(slot.width),
        height: Math.round(slot.height),
      })),
    };
  },
}));
