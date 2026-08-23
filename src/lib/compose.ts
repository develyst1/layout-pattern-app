import type { TemplateFile } from '@shared/contract';
import { coverSourceRect } from '@/lib/cover';
import type { PlacedPhoto } from '@/store/useTemplateStore';

/**
 * The compositor (SPEC-002 §6 "Generate" step 2, Req 6 / 12) — the finished
 * image, at full resolution, in one function.
 *
 * **The on-screen scale is never involved anywhere in here** (Req 6 / B4): the
 * canvas is `template.canvasWidth` x `template.canvasHeight`, and the slot
 * rectangles are the template's own numbers. The preview's scale-to-fit lives in
 * `UseTemplateCanvas.fitScale` and stops there. This is why the export is a bare
 * 2D canvas and not a Konva stage export (SPEC-002 §1).
 *
 * **Nothing is ever painted that a slot did not ask for.** A fresh 2D canvas is
 * transparent; no `fillRect`, no background, no border, no placeholder. Empty
 * slots and everything outside every slot simply stay transparent, which is
 * Req 12 / B15 for free. Slots that hang off the canvas are clipped by the
 * canvas itself — there is nothing to special-case.
 */
export function composeTemplateToCanvas(
  template: TemplateFile,
  photos: Record<string, PlacedPhoto>,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = template.canvasWidth;
  canvas.height = template.canvasHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    // A 2D context is refused only by a browser that has none, which Electron's
    // renderer is not. Returning the correctly sized, still-transparent canvas
    // keeps this function total and leaves the caller's `toBlob` path unchanged.
    return canvas;
  }

  // `slots` is kept back-most first by `normalizeZIndex`, so drawing in array
  // order reproduces the designer's own overlap (B6) — the same order the
  // preview paints in.
  for (const slot of template.slots) {
    const photo = photos[slot.id];
    if (!photo) {
      // An empty slot is not drawn as anything at all (Req 12 / B15).
      continue;
    }
    const crop = coverSourceRect(
      photo.image.naturalWidth,
      photo.image.naturalHeight,
      slot.width,
      slot.height,
    );
    // SPEC-002 §5's guard: a zero-sized decoded image gives an empty source
    // rectangle and the caller draws nothing — identical to the preview.
    if (crop.sw <= 0 || crop.sh <= 0) {
      continue;
    }
    // The source-rect form fits the photo exactly to the slot rectangle, so no
    // clipping call is needed and preview and PNG crop identically (B5).
    context.drawImage(
      photo.image,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      slot.x,
      slot.y,
      slot.width,
      slot.height,
    );
  }

  return canvas;
}
