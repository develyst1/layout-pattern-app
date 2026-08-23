import { Fragment, useEffect, useRef, useState } from 'react';
import { Image as KonvaImage, Layer, Rect, Stage, Text } from 'react-konva';
import { coverSourceRect } from '@/lib/cover';
import { useTemplateStore } from '@/store/useTemplateStore';

const LABEL_FONT_SIZE = 13;
const LABEL_INSET = 6;

/**
 * Scale-to-fit, capped at 1 — the designer's rule (SPEC-001 §5), exported so the
 * cap is assertable without a DOM. `0` means "not measured yet / nothing to draw",
 * and the stage is not rendered at all in that case.
 */
export function fitScale(
  canvasWidth: number,
  canvasHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): number {
  if (viewportWidth <= 0 || viewportHeight <= 0 || canvasWidth <= 0 || canvasHeight <= 0) {
    return 0;
  }
  // Never magnify: a canvas smaller than the viewport is drawn at 1:1.
  return Math.min(viewportWidth / canvasWidth, viewportHeight / canvasHeight, 1);
}

/**
 * The Use Template preview (SPEC-002 §6 "The preview"): the same stage the
 * designer draws, **read-only**. No `draggable`, no `Transformer`, no selection,
 * no mutation of any kind — this mode never edits a layout.
 *
 * Slots are drawn back-most first: `slots` is kept sorted that way by
 * `normalizeZIndex`, so overlap here is the designer's own order (B6). An empty
 * slot is an unfilled rectangle plus its name (Req 3); a **filled** slot is the
 * photo, centre-cropped by `coverSourceRect` and carrying **no name label** —
 * the photo is the label.
 */
export function UseTemplateCanvas(): JSX.Element {
  const template = useTemplateStore((state) => state.template);
  const photos = useTemplateStore((state) => state.photos);

  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const box = entries[0].contentRect;
      setViewport({ width: box.width, height: box.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const canvasWidth = template?.canvasWidth ?? 0;
  const canvasHeight = template?.canvasHeight ?? 0;
  const scale = fitScale(canvasWidth, canvasHeight, viewport.width, viewport.height);

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center overflow-hidden bg-slate-200 p-4 dark:bg-slate-800"
    >
      {template && scale > 0 && (
        <Stage
          width={canvasWidth * scale}
          height={canvasHeight * scale}
          scaleX={scale}
          scaleY={scale}
          className="shadow-lg"
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={canvasWidth}
              height={canvasHeight}
              fill="#ffffff"
              listening={false}
            />
            {template.slots.map((slot) => {
              const photo = photos[slot.id];
              if (photo) {
                const crop = coverSourceRect(
                  photo.image.naturalWidth,
                  photo.image.naturalHeight,
                  slot.width,
                  slot.height,
                );
                // SPEC-002 §5's guard: a zero-sized decoded image gives an empty
                // source rectangle and the caller draws nothing at all.
                if (crop.sw <= 0 || crop.sh <= 0) {
                  return null;
                }
                return (
                  <KonvaImage
                    key={slot.id}
                    image={photo.image}
                    x={slot.x}
                    y={slot.y}
                    width={slot.width}
                    height={slot.height}
                    crop={{ x: crop.sx, y: crop.sy, width: crop.sw, height: crop.sh }}
                    listening={false}
                  />
                );
              }
              return (
                <Fragment key={slot.id}>
                  <Rect
                    x={slot.x}
                    y={slot.y}
                    width={slot.width}
                    height={slot.height}
                    stroke={slot.color}
                    strokeWidth={1}
                    strokeScaleEnabled={false}
                    listening={false}
                  />
                  <Text
                    x={slot.x + LABEL_INSET / scale}
                    y={slot.y + LABEL_INSET / scale}
                    width={Math.max(slot.width - (LABEL_INSET / scale) * 2, 1)}
                    text={slot.name}
                    fontSize={LABEL_FONT_SIZE / scale}
                    fill="#0f172a"
                    wrap="none"
                    ellipsis
                    listening={false}
                  />
                </Fragment>
              );
            })}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
