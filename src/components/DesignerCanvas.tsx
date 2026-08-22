import { useCallback, useEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import { Layer, Rect, Stage, Transformer } from 'react-konva';
import { MIN_SLOT_SIZE, useDesignerStore } from '@/store/designerStore';
import { SlotRect } from './SlotRect';

/**
 * The Konva stage. The stage is *scaled to fit* its container while the store
 * keeps true canvas pixels — Konva reports child coordinates in the unscaled
 * system, so nothing has to be divided back out (SPEC-001 §5, TASK-003).
 */
export function DesignerCanvas(): JSX.Element {
  const canvasWidth = useDesignerStore((state) => state.canvasWidth);
  const canvasHeight = useDesignerStore((state) => state.canvasHeight);
  const slots = useDesignerStore((state) => state.slots);
  const selectedSlotId = useDesignerStore((state) => state.selectedSlotId);
  const selectSlot = useDesignerStore((state) => state.selectSlot);
  const updateSlot = useDesignerStore((state) => state.updateSlot);

  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const nodesRef = useRef(new Map<string, Konva.Rect>());
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

  const registerNode = useCallback((id: string, node: Konva.Rect | null) => {
    if (node) {
      nodesRef.current.set(id, node);
    } else {
      nodesRef.current.delete(id);
    }
  }, []);

  // Never magnify: a canvas smaller than the viewport is drawn at 1:1.
  const scale =
    viewport.width > 0 && viewport.height > 0
      ? Math.min(viewport.width / canvasWidth, viewport.height / canvasHeight, 1)
      : 0;

  // Re-attach after every render that can add, remove or reorder nodes.
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) {
      return;
    }
    const node = selectedSlotId ? nodesRef.current.get(selectedSlotId) : undefined;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedSlotId, slots, scale]);

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center overflow-hidden bg-slate-200 p-4 dark:bg-slate-800"
    >
      {scale > 0 && (
        <Stage
          width={canvasWidth * scale}
          height={canvasHeight * scale}
          scaleX={scale}
          scaleY={scale}
          className="shadow-lg"
          onMouseDown={(event) => {
            if (event.target === event.target.getStage()) {
              selectSlot(null);
            }
          }}
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
            {slots.map((slot) => (
              <SlotRect
                key={slot.id}
                slot={slot}
                isSelected={slot.id === selectedSlotId}
                scale={scale}
                onSelect={() => selectSlot(slot.id)}
                onChange={(patch) => updateSlot(slot.id, patch)}
                registerNode={registerNode}
              />
            ))}
            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              keepRatio={false}
              ignoreStroke
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < MIN_SLOT_SIZE * scale || newBox.height < MIN_SLOT_SIZE * scale
                  ? oldBox
                  : newBox
              }
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
