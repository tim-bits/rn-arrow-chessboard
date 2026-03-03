import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { POP_DOWN_MS, POP_LIFT, POP_SCALE, POP_UP_MS } from '../../constants/motion';

interface BoardSquareProps {
  squareNotation: string;
  pieceKey: string | null;
  pieceImage: any;
  isLight: boolean;
  isSelected: boolean;
  isLegal: boolean;
  isKingInCheck: boolean;
  kingSquare: string | null;
  isGameOver: boolean;
  isDragged?: boolean;
  disablePop?: boolean;
}

const BoardSquareComponent: React.FC<BoardSquareProps> = ({
  squareNotation,
  pieceKey,
  pieceImage,
  isLight,
  isSelected,
  isLegal,
  isKingInCheck,
  kingSquare,
  isGameOver,
  isDragged = false,
  disablePop = false,
}) => {
  const bg = isLight ? '#f0d9b5' : '#b58863';

  const pop = useSharedValue(0);

  React.useEffect(() => {
    const shouldPop =
      Boolean(pieceImage) &&
      isSelected &&
      !disablePop &&
      !isGameOver;
    // if (__DEV__) {
    //   console.log('[PopDebug]', squareNotation, {
    //     shouldPop,
    //     isSelected,
    //     disablePop,
    //     isGameOver,
    //     hasPiece: Boolean(pieceImage),
    //   });
    // }
    if (!shouldPop) {
      pop.value = withTiming(0, { duration: 40 });
      return;
    }
    pop.value = withSequence(
      withTiming(1, { duration: POP_UP_MS + 30, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: POP_DOWN_MS + 30, easing: Easing.in(Easing.quad) })
    );
  }, [isSelected, isDragged, disablePop, pieceImage, isGameOver, kingSquare, squareNotation, pop]);

  const pieceAnimatedStyle = useAnimatedStyle(() => {
    const lift = (POP_LIFT - 1) * pop.value;
    const scale = 1 + (POP_SCALE + 0.02) * pop.value;

    return {
      transform: [{ translateY: lift }, { scale }],
    };
  });

  return (
    <View style={[styles.square, { backgroundColor: bg }]}>
      {pieceImage ? (
        <Animated.Image
          source={pieceImage}
          style={[
            styles.pieceImage,
            pieceAnimatedStyle,
            { opacity: isDragged ? 0 : 1 },
          ]}
          resizeMode="contain"
          fadeDuration={0}
        />
      ) : null}
      {isLegal && !isSelected && <View style={styles.legalMoveDot} />}
      {isSelected && <View style={styles.selectedBorder} />}
      {isKingInCheck && <View style={styles.checkBorder} />}
    </View>
  );
};

export const BoardSquare = React.memo(
  BoardSquareComponent,
  (prev, next) =>
    prev.squareNotation === next.squareNotation &&
    prev.pieceKey === next.pieceKey &&
    prev.isLight === next.isLight &&
    prev.isSelected === next.isSelected &&
    prev.isLegal === next.isLegal &&
    prev.isKingInCheck === next.isKingInCheck &&
    prev.kingSquare === next.kingSquare &&
    prev.isGameOver === next.isGameOver &&
    prev.isDragged === next.isDragged &&
    prev.disablePop === next.disablePop
);

const styles = StyleSheet.create({
  square: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pieceImage: { width: '80%', height: '80%' },
  legalMoveDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    top: '50%',
    left: '50%',
    marginTop: -6,
    marginLeft: -6,
  },
  selectedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: '#d4af37',
  },
  checkBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: '#ff0000',
  },
});
