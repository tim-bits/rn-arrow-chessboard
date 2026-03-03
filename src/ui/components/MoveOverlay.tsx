import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import Animated, {
  AnimatedStyleProp,
  ViewStyle,
} from 'react-native-reanimated';
import type { ImageSourcePropType } from 'react-native';

type MoveOverlayProps = {
  squareSize: number;
  animatedMove: {
    from: string;
    to: string;
    image: ImageSourcePropType;
    captured?: { square: string; image: ImageSourcePropType };
  } | null;
  capturedOverlayPos: { left: number; top: number } | null;
  movePieceStyle: AnimatedStyleProp<ViewStyle>;
};

export const MoveOverlay: React.FC<MoveOverlayProps> = ({
  squareSize,
  animatedMove,
  capturedOverlayPos,
  movePieceStyle,
}) => {
  const capturedOverlay =
    animatedMove?.captured && capturedOverlayPos
      ? { ...animatedMove.captured, pos: capturedOverlayPos }
      : null;

  return (
    <>
      {capturedOverlay && (
        <View
          pointerEvents="none"
          style={[
            styles.capturedPiece,
            {
              width: squareSize,
              height: squareSize,
              left: capturedOverlay.pos.left,
              top: capturedOverlay.pos.top,
            } as any,
          ]}
        >
          <Image
            source={capturedOverlay.image}
            style={styles.movePieceImage}
            resizeMode="contain"
            fadeDuration={0}
          />
        </View>
      )}

      {animatedMove && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.movePiece,
            { width: squareSize, height: squareSize },
            movePieceStyle,
          ]}
        >
          <Image
            source={animatedMove.image}
            style={styles.movePieceImage}
            resizeMode="contain"
            fadeDuration={0}
          />
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  movePiece: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturedPiece: {
    position: 'absolute',
    zIndex: 850,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movePieceImage: {
    width: '80%',
    height: '80%',
  },
});

export default MoveOverlay;
