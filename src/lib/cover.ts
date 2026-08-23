/**
 * Cover-crop arithmetic (SPEC-002 §5, Req 5) — the **one** definition shared by
 * the on-screen preview and the exported PNG, so the two crop identically (B5).
 *
 * Pure: no DOM, no imports, no rounding. Both consumers take floats —
 * `ctx.drawImage(img, sx, sy, sw, sh, …)` and Konva's
 * `crop={{ x: sx, y: sy, width: sw, height: sh }}` read the same four numbers.
 */

export interface SourceRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * The centred source rectangle of a `cover` fit: the largest centred rectangle
 * of the image whose aspect ratio equals the slot's. Stretching *that* onto the
 * whole slot fills it without distortion and without letterboxing — the source
 * rectangle is always fully inside the image and always exactly the slot's ratio,
 * by construction.
 *
 * Guard (SPEC-002 §5): any input `<= 0` or not finite returns all zeros and the
 * caller draws nothing. `parseTemplateFile` already rejects slots with a
 * non-positive `width`/`height`, so in practice this only defends against a
 * decoded image of zero size.
 */
export function coverSourceRect(
  imgW: number,
  imgH: number,
  slotW: number,
  slotH: number,
): SourceRect {
  for (const value of [imgW, imgH, slotW, slotH]) {
    if (!Number.isFinite(value) || value <= 0) {
      return { sx: 0, sy: 0, sw: 0, sh: 0 };
    }
  }
  const sw = Math.min(imgW, (imgH * slotW) / slotH);
  const sh = Math.min(imgH, (imgW * slotH) / slotW);
  return { sx: (imgW - sw) / 2, sy: (imgH - sh) / 2, sw, sh };
}
