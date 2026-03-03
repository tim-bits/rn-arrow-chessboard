import { useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import type { ImageSourcePropType } from 'react-native';
import type { Square } from '../../types/shared';

export interface DraggedPiece {
  image: ImageSourcePropType;
  square: Square;
}

export const useDragState = () => {
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const [draggedPiece, setDraggedPiece] = useState<DraggedPiece | null>(null);

  return {
    dragX,
    dragY,
    isDragging,
    draggedPiece,
    setDraggedPiece,
  };
};
