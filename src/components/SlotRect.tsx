import type Konva from 'konva';
import { Rect, Text } from 'react-konva';
import type { SlotData } from '@shared/contract';
import { MIN_SLOT_SIZE, type SlotPatch } from '@/store/designerStore';

interface SlotRectProps {
  slot: SlotData;
  isSelected: boolean;
  /** Stage scale, so screen-constant sizes (label, outline) can be un-scaled. */
  scale: number;
  onSelect: () => void;
  onChange: (patch: SlotPatch) => void;
  registerNode: (id: string, node: Konva.Rect | null) => void;
}

const LABEL_FONT_SIZE = 13;
const LABEL_INSET = 6;

/**
 * One slot on the stage: the draggable / transformable rectangle plus its name.
 * The label is a sibling with `listening={false}` rather than a group child, so
 * the Transformer attaches to a plain Rect and `scaleX/Y` bake straight back
 * into `width`/`height` (SPEC-001 §5 "Move / resize").
 */
export function SlotRect({
  slot,
  isSelected,
  scale,
  onSelect,
  onChange,
  registerNode,
}: SlotRectProps): JSX.Element {
  const inset = LABEL_INSET / scale;

  return (
    <>
      <Rect
        ref={(node) => registerNode(slot.id, node)}
        x={slot.x}
        y={slot.y}
        width={slot.width}
        height={slot.height}
        fill={slot.color}
        stroke={isSelected ? '#0f172a' : 'rgba(15, 23, 42, 0.35)'}
        strokeWidth={isSelected ? 2 : 1}
        strokeScaleEnabled={false}
        draggable
        onMouseDown={onSelect}
        onTap={onSelect}
        onDragMove={(event) => onChange({ x: event.target.x(), y: event.target.y() })}
        onDragEnd={(event) => onChange({ x: event.target.x(), y: event.target.y() })}
        onTransformEnd={(event) => {
          const node = event.target as Konva.Rect;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(MIN_SLOT_SIZE, node.width() * scaleX),
            height: Math.max(MIN_SLOT_SIZE, node.height() * scaleY),
          });
        }}
      />
      <Text
        x={slot.x + inset}
        y={slot.y + inset}
        width={Math.max(slot.width - inset * 2, 1)}
        text={slot.name}
        fontSize={LABEL_FONT_SIZE / scale}
        fill="#0f172a"
        wrap="none"
        ellipsis
        listening={false}
      />
    </>
  );
}
