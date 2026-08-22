import { create } from 'zustand';
import { TEMPLATE_FORMAT_VERSION, type SlotData, type TemplateFile } from '@shared/contract';

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
 * SPEC-001 §3: `zIndex` is contiguous `0 … n-1`, `0` = back-most. Called after
 * every mutation, and it also leaves `slots` sorted back-most first, so array
 * order and paint order are the same thing everywhere downstream.
 */
function normalizeZIndex(slots: SlotData[]): SlotData[] {
  return [...slots]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((slot, index) => (slot.zIndex === index ? slot : { ...slot, zIndex: index }));
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
  replaceAll: (template) =>
    set({
      canvasWidth: template.canvasWidth,
      canvasHeight: template.canvasHeight,
      templateName: template.name,
      slots: normalizeZIndex(template.slots),
      selectedSlotId: null,
    }),

  toTemplateFile: () => {
    const { templateName, canvasWidth, canvasHeight, slots } = get();
    return {
      formatVersion: TEMPLATE_FORMAT_VERSION,
      name: templateName,
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
