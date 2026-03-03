import React from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { DraggedPiece as DraggedPieceType } from '../hooks/useDragState';

interface DraggedPieceProps {
  draggedPiece: DraggedPieceType | null;
  dragX: any;
  dragY: any;
  isDragging: any;
  squareSize: number;
}

export const DraggedPiece: React.FC<DraggedPieceProps> = ({
  draggedPiece,
  dragX,
  dragY,
  isDragging,
  squareSize,
}) => {
  const draggedPieceStyle = useAnimatedStyle(() => {
    if (!isDragging.value) return { opacity: 0 };

    return {
      position: 'absolute',
      width: squareSize * 1.2,
      height: squareSize * 1.2,
      left: dragX.value - (squareSize * 1.2) / 2,
      top: dragY.value - (squareSize * 1.2) / 2,
      opacity: 1,
      zIndex: 1000,
    };
  });

  if (!draggedPiece) return null;

  return (
    <Animated.View style={draggedPieceStyle}>
      <Image
        source={draggedPiece.image}
        style={styles.image}
        resizeMode="contain"
        fadeDuration={0}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
