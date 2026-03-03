import * as React from 'react';
import {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  MOVE_GLIDE_BASE_MS,
  MOVE_GLIDE_MAX_MS,
  MOVE_GLIDE_MIN_MS,
  MOVE_GLIDE_PER_SQUARE_MS,
  DRAG_SNAP_MS,
} from '../../constants/motion';
import type { Square } from '../../types/shared';
import { squareToPixel } from '../../utils/boardGeometry';
import { readManualMoveStart } from '../../utils/interactionTiming';
import { useChessStore, chessSelectors } from '../../store/chessStore';
import { useDragState } from './useDragState';
import { useChessInteraction } from './useChessInteraction';
import { useChessGestures } from './useChessGestures';
import { log } from '../../utils/log';
import { PIECE_IMAGES } from '../constants/pieceImages';

const squareDistance = (from: Square, to: Square) => {
  const fromFile = from.charCodeAt(0) - 97;
  const toFile = to.charCodeAt(0) - 97;
  const fromRank = parseInt(from[1] ?? '0', 10);
  const toRank = parseInt(to[1] ?? '0', 10);
  return Math.max(Math.abs(fromFile - toFile), Math.abs(fromRank - toRank));
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export function useChessOrchestration({
  effectiveBoardSize,
  effectiveOrientation,
  onMove,
  autoPromoteToQueen,
  onUserInteraction,
  handlePromotion,
}: {
  effectiveBoardSize: number;
  effectiveOrientation: 'white' | 'black';
  onMove?: (move: { from: string; to: string; promotion?: string }) => void;
  autoPromoteToQueen: boolean;
  onUserInteraction?: () => boolean | void;
  handlePromotion: (from: Square, to: Square) => void;
}) {
  const animatingMove = chessSelectors.useAnimatingMove();
  const storeBoard = chessSelectors.useBoard();
  const selectedSquare = chessSelectors.useSelectedSquare();
  const legalMoves = chessSelectors.useLegalMoves();
  const storeOrientation = chessSelectors.useOrientation();
  const arrows = chessSelectors.useArrows();
  const arrowColorFromStore = chessSelectors.useArrowColor();
  const isCheck = chessSelectors.useIsCheck();
  const isCheckmate = chessSelectors.useIsCheckmate();
  const kingSquare = chessSelectors.useKingSquare();
  const legalMovesSet = React.useMemo(
    () => new Set(legalMoves as string[]),
    [legalMoves]
  );

  const { performMove } = useChessInteraction({ autoPromoteToQueen, onMove });
  const wrappedPerformMove = React.useCallback(
    (from: Square, to: Square, promotion?: string) =>
      performMove(from, to, promotion, handlePromotion),
    [performMove, handlePromotion]
  );

  // Drag state
  const { dragX, dragY, isDragging, draggedPiece, setDraggedPiece } =
    useDragState();
  const [isDraggingFlag, setIsDraggingFlag] = React.useState(false);
  useAnimatedReaction(
    () => isDragging.value,
    (val) => {
      runOnJS(setIsDraggingFlag)(!!val);
    },
    [isDragging]
  );

  // Animated overlay state
  const moveFromX = useSharedValue(0);
  const moveFromY = useSharedValue(0);
  const moveToX = useSharedValue(0);
  const moveToY = useSharedValue(0);
  const moveProgress = useSharedValue(0);
  const moveOpacity = useSharedValue(0);
  const moveScale = useSharedValue(1);
  const moveAnimIdRef = React.useRef(0);
  const lastAnimatedMoveRef = React.useRef<string | null>(null);
  const manualOverlayMoveKeyRef = React.useRef<string | null>(null);
  const [animatedMove, setAnimatedMove] = React.useState<{
    from: Square;
    to: Square;
    image: any;
    captured?: { square: Square; image: any };
  } | null>(null);
  const animatedMoveRef = React.useRef<typeof animatedMove>(null);
  React.useEffect(() => {
    animatedMoveRef.current = animatedMove;
  }, [animatedMove]);

  const board = React.useMemo(() => {
    if (animatingMove) {
      return animatingMove.fromPosition.board();
    }
    return storeBoard;
  }, [animatingMove, storeBoard]);

  const movePieceStyle = useAnimatedStyle(() => {
    const x = interpolate(
      moveProgress.value,
      [0, 1],
      [moveFromX.value, moveToX.value]
    );
    const y = interpolate(
      moveProgress.value,
      [0, 1],
      [moveFromY.value, moveToY.value]
    );
    return {
      opacity: moveOpacity.value,
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: moveScale.value },
      ],
    };
  });

  const cancelActiveAnimation = React.useCallback(() => {
    const state = useChessStore.getState();
    if (!state.animatingMove && !state.pendingBoardUpdate) {
      return;
    }

    moveAnimIdRef.current += 1;
    lastAnimatedMoveRef.current = null;
    manualOverlayMoveKeyRef.current = null;
    setAnimatedMove(null);
    moveOpacity.value = 0;
    moveProgress.value = 1;
    moveScale.value = 1;

    if (state.pendingBoardUpdate) {
      state.completeAnimation();
    } else if (state.animatingMove) {
      useChessStore.setState({ animatingMove: null });
    }
  }, [moveOpacity, moveProgress, moveScale]);

  const movePieceStylePublic = movePieceStyle;

  const handleUserInteraction = React.useCallback(() => {
    cancelActiveAnimation();
    return onUserInteraction?.();
  }, [cancelActiveAnimation, onUserInteraction]);

  const clearAnimatedMove = React.useCallback((id: number) => {
    if (moveAnimIdRef.current !== id) return;

    log(
      '[Animation] Completing store update, clearing overlay next frame',
      `t=${Date.now()}`,
      `token=${useChessStore.getState().moveToken}`
    );
    const manual = readManualMoveStart();
    const currentMove = animatedMoveRef.current;
    if (
      manual &&
      currentMove &&
      manual.from === currentMove.from &&
      manual.to === currentMove.to
    ) {
      const delta = Date.now() - manual.ts;
      log(
        `[Timing] manual move -> animation complete ${currentMove.from}->${currentMove.to} ${delta}ms kind=${manual.kind} token=${manual.token}`
      );
    }
    // Complete the board update in the store FIRST
    useChessStore.getState().completeAnimation();

    // Clear overlay immediately and process queue (no extra frame delay)
    // Clear overlay on next frame to avoid a one-frame gap
    requestAnimationFrame(() => {
      if (moveAnimIdRef.current !== id) return;
      setAnimatedMove(null);
      manualOverlayMoveKeyRef.current = null;
      useChessStore.getState().processQueue();
    });
  }, []);

  const startManualOverlay = React.useCallback(
    (move: {
      from: Square;
      to: Square;
      kind: 'tap' | 'drag';
      x?: number;
      y?: number;
    }) => {
      const { from, to, kind, x, y } = move;
      const chess = useChessStore.getState().chess;
      const piece = chess.get(from);
      if (!piece) return;

      const image = PIECE_IMAGES[`${piece.color}${piece.type.toUpperCase()}`];
      if (!image) return;

      manualOverlayMoveKeyRef.current = `${from}-${to}`;
      lastAnimatedMoveRef.current = `${from}-${to}`;
      const id = ++moveAnimIdRef.current;

      setAnimatedMove({
        from,
        to,
        image,
      });

      const [fromCenterX, fromCenterY] = squareToPixel(
        from,
        effectiveBoardSize,
        effectiveBoardSize,
        effectiveOrientation
      );
      const [toCenterX, toCenterY] = squareToPixel(
        to,
        effectiveBoardSize,
        effectiveBoardSize,
        effectiveOrientation
      );

      const useDragRelease =
        kind === 'drag' && typeof x === 'number' && typeof y === 'number';

      const fromX = useDragRelease
        ? x - effectiveBoardSize / 8 / 2
        : fromCenterX - effectiveBoardSize / 8 / 2;
      const fromY = useDragRelease
        ? y - effectiveBoardSize / 8 / 2
        : fromCenterY - effectiveBoardSize / 8 / 2;

      const toX = toCenterX - effectiveBoardSize / 8 / 2;
      const toY = toCenterY - effectiveBoardSize / 8 / 2;

      moveFromX.value = fromX;
      moveFromY.value = fromY;
      moveToX.value = toX;
      moveToY.value = toY;
      moveProgress.value = 0;
      moveOpacity.value = 1;
      moveScale.value = useDragRelease ? 1.25 : 1;

      const duration = useDragRelease
        ? DRAG_SNAP_MS
        : clamp(
            MOVE_GLIDE_BASE_MS +
              MOVE_GLIDE_PER_SQUARE_MS *
                Math.max(0, squareDistance(from, to) - 1),
            MOVE_GLIDE_MIN_MS,
            MOVE_GLIDE_MAX_MS
          );

      if (useDragRelease) {
        moveScale.value = withTiming(1, {
          duration,
          easing: Easing.out(Easing.cubic),
        });
      }

      moveProgress.value = withTiming(
        1,
        { duration, easing: Easing.inOut(Easing.cubic) },
        (finished: boolean) => {
          'worklet';
          if (!finished) return;
          runOnJS(clearAnimatedMove)(id);
        }
      );
    },
    [
      effectiveBoardSize,
      effectiveOrientation,
      moveFromX,
      moveFromY,
      moveToX,
      moveToY,
      moveOpacity,
      moveProgress,
      moveScale,
      clearAnimatedMove,
    ]
  );

  const cancelManualOverlay = React.useCallback(
    (move: { from: Square; to: Square }) => {
      const moveKey = `${move.from}-${move.to}`;
      if (manualOverlayMoveKeyRef.current !== moveKey) {
        return;
      }
      moveAnimIdRef.current += 1;
      manualOverlayMoveKeyRef.current = null;
      lastAnimatedMoveRef.current = null;
      setAnimatedMove(null);
      moveOpacity.value = 0;
      moveProgress.value = 1;
      moveScale.value = 1;
    },
    [moveOpacity, moveProgress, moveScale]
  );

  const handleManualMoveIntent = React.useCallback(
    (move: {
      from: Square;
      to: Square;
      kind: 'tap' | 'drag';
      x?: number;
      y?: number;
    }) => {
      startManualOverlay(move);
    },
    [startManualOverlay]
  );

  const handleManualMoveResult = React.useCallback(
    (move: {
      from: Square;
      to: Square;
      kind: 'tap' | 'drag';
      success: boolean;
    }) => {
      if (!move.success) {
        cancelManualOverlay(move);
      }
    },
    [cancelManualOverlay]
  );

  const { combinedGesture } = useChessGestures({
    boardSize: effectiveBoardSize,
    orientation: effectiveOrientation,
    dragX,
    dragY,
    isDragging,
    setDraggedPiece,
    performMove: wrappedPerformMove,
    onManualMoveIntent: handleManualMoveIntent,
    onManualMoveResult: handleManualMoveResult,
    onUserInteraction: handleUserInteraction,
  });

  // Start overlay when store sets animatingMove (programmatic/tap moves)
  React.useLayoutEffect(() => {
    if (!animatingMove) return;

    const moveKey = `${animatingMove.moveData.from}-${animatingMove.moveData.to}`;

    // If manual overlay already active for this move, just hydrate capture info
    if (manualOverlayMoveKeyRef.current === moveKey) {
      const moveData = animatingMove.moveData;
      if (moveData.captured && animatedMove && !animatedMove.captured) {
        const capturedColor = moveData.color === 'w' ? 'b' : 'w';
        const capturedImage =
          PIECE_IMAGES[`${capturedColor}${moveData.captured.toUpperCase()}`];
        if (capturedImage) {
          const isEnPassant = moveData.flags?.includes('e');
          const capturedSquare = isEnPassant
            ? (`${moveData.to[0]}${moveData.from[1]}` as Square)
            : moveData.to;
          setAnimatedMove({
            ...animatedMove,
            captured: { square: capturedSquare, image: capturedImage },
          });
        }
      }
      return;
    }

    if (lastAnimatedMoveRef.current === moveKey) return;
    lastAnimatedMoveRef.current = moveKey;

    const fromPosition = animatingMove.fromPosition;
    const moveData = animatingMove.moveData;
    const piece = fromPosition.get(moveData.from);
    if (!piece) {
      log('[Animation] No piece at source square - should not happen');
      return;
    }

    const image = PIECE_IMAGES[`${piece.color}${piece.type.toUpperCase()}`];
    if (!image) {
      log('[Animation] No image for piece:', piece);
      return;
    }

    let captured: { square: Square; image: any } | undefined;
    if (moveData.captured) {
      const capturedColor = moveData.color === 'w' ? 'b' : 'w';
      const capturedImage =
        PIECE_IMAGES[`${capturedColor}${moveData.captured.toUpperCase()}`];
      if (capturedImage) {
        const isEnPassant = moveData.flags?.includes('e');
        const capturedSquare = isEnPassant
          ? (`${moveData.to[0]}${moveData.from[1]}` as Square)
          : moveData.to;
        captured = { square: capturedSquare, image: capturedImage };
      }
    }

    const id = ++moveAnimIdRef.current;
    setAnimatedMove({
      from: moveData.from,
      to: moveData.to,
      image,
      captured,
    });

    const squareSize = effectiveBoardSize / 8;
    const [fromCenterX, fromCenterY] = squareToPixel(
      moveData.from,
      effectiveBoardSize,
      effectiveBoardSize,
      effectiveOrientation
    );
    const [toCenterX, toCenterY] = squareToPixel(
      moveData.to,
      effectiveBoardSize,
      effectiveBoardSize,
      effectiveOrientation
    );

    moveFromX.value = fromCenterX - squareSize / 2;
    moveFromY.value = fromCenterY - squareSize / 2;
    moveToX.value = toCenterX - squareSize / 2;
    moveToY.value = toCenterY - squareSize / 2;
    moveProgress.value = 0;
    moveOpacity.value = 1;
    moveScale.value = 1;

    const duration = clamp(
      MOVE_GLIDE_BASE_MS +
        MOVE_GLIDE_PER_SQUARE_MS *
          Math.max(0, squareDistance(moveData.from, moveData.to) - 1),
      MOVE_GLIDE_MIN_MS,
      MOVE_GLIDE_MAX_MS
    );

    const timingConfig = {
      duration,
      easing: Easing.inOut(Easing.cubic),
    };

    moveProgress.value = withTiming(1, timingConfig, (finished: boolean) => {
      'worklet';
      if (!finished) return;
      runOnJS(clearAnimatedMove)(id);
    });
  }, [
    animatingMove,
    animatedMove,
    effectiveBoardSize,
    effectiveOrientation,
    moveFromX,
    moveFromY,
    moveToX,
    moveToY,
    moveOpacity,
    moveProgress,
    moveScale,
    clearAnimatedMove,
  ]);

  return {
    board,
    animatingMove,
    selectedSquare,
    legalMovesSet,
    storeOrientation,
    arrows,
    arrowColorFromStore,
    isCheck,
    isCheckmate,
    isStalemate: chessSelectors.useIsStalemate(),
    kingSquare,
    dragX,
    dragY,
    isDragging,
    isDraggingFlag,
    draggedPiece,
    animatedMove,
    setAnimatedMove,
    movePieceStyle: movePieceStylePublic,
    combinedGesture,
    cancelActiveAnimation,
    handleUserInteraction,
    performMove: wrappedPerformMove,
  };
}
