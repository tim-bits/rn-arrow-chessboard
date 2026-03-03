import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { ArrowPair } from '../types/shared';
import { squareToPixel } from '../utils/boardGeometry';

export type ArrowStyle = {
  color?: string;
  opacity?: number;
  thicknessScale?: number;
};

type ArrowOverlayProps = {
  arrows?: ArrowPair[];
  boardWidth: number;
  boardHeight: number;
  orientation: 'white' | 'black';
  arrowStyle?: ArrowStyle;
};

function makeArrowPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  thickness: number,
  headLengthOverride?: number,
  headPad = 4
) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;

  const headLength = headLengthOverride ?? Math.max(thickness * 1.25, 6);
  const shaftEndX = toX - ux * (headLength + headPad);
  const shaftEndY = toY - uy * (headLength + headPad);

  const half = thickness / 2;
  const headHalf = Math.max(headLength * 0.85, thickness);

  const Ax = fromX + px * half;
  const Ay = fromY + py * half;
  const Bx = fromX - px * half;
  const By = fromY - py * half;
  const Cx = shaftEndX - px * half;
  const Cy = shaftEndY - py * half;
  const Dx = shaftEndX + px * half;
  const Dy = shaftEndY + py * half;

  const tipX = toX;
  const tipY = toY;
  const leftX = shaftEndX + px * headHalf;
  const leftY = shaftEndY + py * headHalf;
  const rightX = shaftEndX - px * headHalf;
  const rightY = shaftEndY - py * headHalf;

  const path = [
    `M ${Ax} ${Ay}`,
    `L ${Dx} ${Dy}`,
    `L ${Cx} ${Cy}`,
    `L ${Bx} ${By}`,
    'Z',
    `M ${tipX} ${tipY}`,
    `L ${leftX} ${leftY}`,
    `L ${rightX} ${rightY}`,
    'Z',
  ].join(' ');
  return path;
}

const ArrowOverlay: React.FC<ArrowOverlayProps> = ({
  arrows = [],
  boardWidth,
  boardHeight,
  orientation,
  arrowStyle = {},
}) => {
  const defaultStyle = {
    color: arrowStyle.color ?? '#FFD700',
    opacity: arrowStyle.opacity ?? 0.6,
    thicknessScale: arrowStyle.thicknessScale ?? 1.0,
  };

  if (!arrows || arrows.length === 0) return <View />;

  // Calculate square size
  const squareSize = boardWidth / 8;

  // Arrow thickness should be proportional to square size
  // Standard is ~12-15% of square size for the base arrow
  const baseThickness = squareSize * 0.15 * defaultStyle.thicknessScale;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.absoluteOverlay,
        { width: boardWidth, height: boardHeight },
      ]}
    >
      <Svg width={boardWidth} height={boardHeight}>
        {arrows.map((pair, idx) => {
          if (!pair || pair.length < 2) return null;
          const [from, to] = pair;
          const [fromX, fromY] = squareToPixel(
            from,
            boardWidth,
            boardHeight,
            orientation
          );
          const [toX, toY] = squareToPixel(
            to,
            boardWidth,
            boardHeight,
            orientation
          );
          // Lower index = thicker arrow (priority visualization)
          const thickness = baseThickness * Math.pow(0.7, idx);
          const path = makeArrowPath(fromX, fromY, toX, toY, thickness);
          return (
            <Path
              key={`arrow-${idx}`}
              d={path}
              fill={defaultStyle.color}
              opacity={defaultStyle.opacity}
            />
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  absoluteOverlay: { position: 'absolute' },
});

export default ArrowOverlay;
