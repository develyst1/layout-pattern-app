// The IPC seam between the Electron main process and the React renderer.
//
// This file is SPEC-001 §4 verbatim, plus the pure `parseTemplateFile`
// validator. It is owned by the SA (Sober): it is read-only for the renderer,
// and no channel, field or result variant may be added here without a SPEC
// change. It imports nothing — no `fs`, no `electron` — so both sides can use it.

export const TEMPLATE_FORMAT_VERSION = 1;

export interface SlotData {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  color: string;
}

export interface TemplateFile {
  formatVersion: number;
  name: string;
  canvasWidth: number;
  canvasHeight: number;
  slots: SlotData[];
}

/** Renderer supplies every user-facing string; main contains none. */
export interface SaveDialogOptions {
  dialogTitle: string;
  fileTypeLabel: string;
  defaultFileName: string;
}

export interface OpenDialogOptions {
  dialogTitle: string;
  fileTypeLabel: string;
}

export type SaveTemplateResult =
  | { status: 'saved'; filePath: string }
  | { status: 'canceled' }
  | { status: 'error'; code: 'INVALID_PAYLOAD' | 'WRITE_FAILED'; detail: string };

export type OpenTemplateResult =
  | { status: 'opened'; filePath: string; content: string }
  | { status: 'canceled' }
  | { status: 'error'; code: 'READ_FAILED'; detail: string };

/** Pure, no I/O — used by the renderer after openTemplate returns raw text. */
export type ParseResult =
  | { ok: true; template: TemplateFile }
  | { ok: false; reason: string };

/** SPEC-001 §3: opaque `#rrggbb`. Case-insensitive on read; written lower-case. */
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPositiveInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value) && value > 0;
}

/**
 * SPEC-001 §9 A-6: slot names are unique inside one template, compared
 * **trimmed and case-insensitively**, so `slot 1` and `Slot 1` are the same
 * name. The stored value keeps the user's own casing; only the comparison folds.
 */
function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Validates the raw text of a template file. Pure: no I/O, no Electron.
 *
 * `reason` is English and developer-facing only — it is logged, never rendered.
 * The renderer shows its own Thai message (SPEC-001 §7 `error.fileUnreadable`).
 */
export function parseTemplateFile(raw: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `not valid JSON: ${message}` };
  }

  if (!isRecord(data)) {
    return { ok: false, reason: 'root value is not a JSON object' };
  }

  const { formatVersion } = data;
  if (formatVersion !== undefined && formatVersion !== TEMPLATE_FORMAT_VERSION) {
    return {
      ok: false,
      reason: `unsupported formatVersion: ${JSON.stringify(formatVersion)}`,
    };
  }

  const { name, canvasWidth, canvasHeight, slots } = data;

  if (typeof name !== 'string') {
    return { ok: false, reason: 'name is missing or not a string' };
  }
  // SPEC-001 §3 / §9 A-11: main refuses to *write* a blank template name
  // (INVALID_PAYLOAD, §4) and REQ-001 A10 disables Save, so a loaded blank name
  // would be a template that can never be saved again.
  if (name.trim() === '') {
    return { ok: false, reason: 'name is blank or whitespace-only' };
  }
  if (!isPositiveInteger(canvasWidth)) {
    return { ok: false, reason: 'canvasWidth is not a positive integer' };
  }
  if (!isPositiveInteger(canvasHeight)) {
    return { ok: false, reason: 'canvasHeight is not a positive integer' };
  }
  if (!Array.isArray(slots)) {
    return { ok: false, reason: 'slots is missing or not an array' };
  }

  const parsedSlots: SlotData[] = [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  for (let index = 0; index < slots.length; index += 1) {
    const slot: unknown = slots[index];
    if (!isRecord(slot)) {
      return { ok: false, reason: `slots[${index}] is not an object` };
    }

    const { id, name: slotName, x, y, width, height, zIndex, color } = slot;

    if (typeof id !== 'string') {
      return { ok: false, reason: `slots[${index}].id is not a string` };
    }
    if (typeof slotName !== 'string') {
      return { ok: false, reason: `slots[${index}].name is not a string` };
    }
    if (!isNumber(x)) {
      return { ok: false, reason: `slots[${index}].x is not a number` };
    }
    if (!isNumber(y)) {
      return { ok: false, reason: `slots[${index}].y is not a number` };
    }
    if (!isNumber(width)) {
      return { ok: false, reason: `slots[${index}].width is not a number` };
    }
    if (!isNumber(height)) {
      return { ok: false, reason: `slots[${index}].height is not a number` };
    }
    if (!isNumber(zIndex) || !Number.isInteger(zIndex)) {
      return { ok: false, reason: `slots[${index}].zIndex is not an integer` };
    }
    if (typeof color !== 'string' || !HEX_COLOR.test(color)) {
      return { ok: false, reason: `slots[${index}].color is not a #rrggbb hex colour` };
    }

    // SPEC-001 §3 "What a loaded file must satisfy" (§9 A-11): reject what this
    // app's own UI can never produce. The blank name is checked BEFORE the
    // duplicate-name check, same order as §5, so a blank never reports as a collision.
    if (slotName.trim() === '') {
      return { ok: false, reason: `slots[${index}].name is blank or whitespace-only` };
    }
    // Not §5's 20x20 floor — that is a Transformer interaction limit, not a file
    // invariant. Zero is invisible and unselectable; negative draws mirrored in Konva.
    if (width <= 0) {
      return { ok: false, reason: `slots[${index}].width is not greater than 0` };
    }
    if (height <= 0) {
      return { ok: false, reason: `slots[${index}].height is not greater than 0` };
    }
    // Exact string comparison — ids are UUIDs; no trimming, no case folding.
    if (seenIds.has(id)) {
      return { ok: false, reason: `duplicate slot id: ${JSON.stringify(id)}` };
    }
    seenIds.add(id);

    const key = nameKey(slotName);
    if (seenNames.has(key)) {
      return {
        ok: false,
        reason: `duplicate slot name (compared trimmed, case-insensitively): ${JSON.stringify(slotName)}`,
      };
    }
    seenNames.add(key);

    parsedSlots.push({ id, name: slotName, x, y, width, height, zIndex, color });
  }

  return {
    ok: true,
    template: {
      formatVersion: TEMPLATE_FORMAT_VERSION,
      name,
      canvasWidth,
      canvasHeight,
      slots: parsedSlots,
    },
  };
}
