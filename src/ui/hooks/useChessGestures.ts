import { useCallback, useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import type { Square } from '../../types/shared';
import { pixelToSquare } from '../../utils/boardGeometry';
import { recordManualMoveStart } from '../../utils/interactionTiming';
import { log } from '../../utils/log';
import { useChessStore, type ChessState } from '../../store/chessStore';
import type { DraggedPiece } from './useDragState';
import { PIECE_IMAGES } from '../constants/pieceImages';

interface UseChessGesturesProps {
  boardSize: number;
  orientation: 'white' | 'black';
  dragX: any;
  dragY: any;
  isDragging: any;
  setDraggedPiece: (piece: DraggedPiece | null) => void;
  performMove: (from: Square, to: Square) => boolean;
  onManualMoveIntent?: (move: {
    from: Square;
    to: Square;
    kind: 'tap' | 'drag';
    x?: number;
    y?: number;
  }) => void;
  onManualMoveResult?: (move: {
    from: Square;
    to: Square;
    kind: 'tap' | 'drag';
    success: boolean;
  }) => void;
  onUserInteraction?: () => boolean | void;
}

export const useChessGestures = ({
  boardSize,
  orientation,
  dragX,
  dragY,
  isDragging,
  setDraggedPiece,
  performMove,
  onManualMoveIntent,
  onManualMoveResult,
  onUserInteraction,
}: UseChessGesturesProps) => {
  const selectSquare = useChessStore((s: ChessState) => s.selectSquare);
  const setDraggedSquare = useChessStore((s: ChessState) => s.setDraggedSquare);
  const getChess = useChessStore((s: ChessState) => s.chess);

  const handleDragStart = useCallback(
    (x: number, y: number) => {
      useChessStore.getState().bumpMoveToken();
      if (onUserInteraction?.() === true) {
        return;
      }
      const sq = pixelToSquare(x, y, boardSize, boardSize, orientation);
      if (!sq) return;

      const piece = getChess.get(sq);
      if (!piece) return;
      // Ignore dragging opponent pieces.
      if (piece.color !== getChess.turn()) return;

      const pieceImage =
        PIECE_IMAGES[`${piece.color}${piece.type.toUpperCase()}`];
      setDraggedPiece({ image: pieceImage, square: sq });
      setDraggedSquare(sq);
      selectSquare(sq);
    },
    [
      boardSize,
      orientation,
      selectSquare,
      getChess,
      setDraggedSquare,
      setDraggedPiece,
      onUserInteraction,
    ]
  );

  const handleDragEnd = useCallback(
    (x: number, y: number) => {
      const to = pixelToSquare(x, y, boardSize, boardSize, orientation);
      const state = useChessStore.getState();
      const from = state.draggedSquare || state.selectedSquare;

      if (to && from && to !== from) {
        log(
          `[Timing] manual drag move start ${from}->${to} t=${Date.now()} token=${useChessStore.getState().moveToken}`
        );
        recordManualMoveStart({
          from,
          to,
          ts: Date.now(),
          token: useChessStore.getState().moveToken,
          kind: 'drag',
        });
        onManualMoveIntent?.({ from, to, kind: 'drag', x, y });
        const success = performMove(from, to);
        onManualMoveResult?.({ from, to, kind: 'drag', success });
      }

      setDraggedPiece(null);
      setDraggedSquare(null);
    },
    [
      boardSize,
      orientation,
      performMove,
      setDraggedSquare,
      setDraggedPiece,
      onManualMoveIntent,
      onManualMoveResult,
    ]
  );

  const handleTap = useCallback(
    (x: number, y: number) => {
      useChessStore.getState().bumpMoveToken();
      if (onUserInteraction?.() === true) {
        return;
      }
      const sq = pixelToSquare(x, y, boardSize, boardSize, orientation);
      if (!sq) return;
      const state = useChessStore.getState();
      const from = state.selectedSquare;
      const legalMoves = state.legalMoves;
      if (from && legalMoves.includes(sq)) {
        log(
          `[Timing] manual tap move start ${from}->${sq} t=${Date.now()} token=${useChessStore.getState().moveToken}`
        );
        recordManualMoveStart({
          from,
          to: sq,
          ts: Date.now(),
          token: useChessStore.getState().moveToken,
          kind: 'tap',
        });
        onManualMoveIntent?.({ from, to: sq, kind: 'tap' });
        const success = performMove(from, sq);
        onManualMoveResult?.({ from, to: sq, kind: 'tap', success });
        return;
      }

      const piece = getChess.get(sq);
      // Tapping empty squares clears selection (chess.com-like behavior).
      if (!piece) {
        selectSquare(null);
        return;
      }

      // Ignore tapping opponent pieces when it's not their turn.
      if (piece.color !== getChess.turn()) {
        return;
      }

      selectSquare(sq);
    },
    [
      boardSize,
      orientation,
      performMove,
      selectSquare,
      onUserInteraction,
      onManualMoveIntent,
      onManualMoveResult,
      getChess,
    ]
  );

  const dragGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(5)
        .onStart((event: any) => {
          const { x, y } = event;
          isDragging.value = true;
          dragX.value = x;
          dragY.value = y;
          runOnJS(handleDragStart)(x, y);
        })
        .onUpdate((event: any) => {
          const { x, y } = event;
          dragX.value = x;
          dragY.value = y;
        })
        .onEnd((event: any) => {
          const { x, y } = event;
          isDragging.value = false;
          runOnJS(handleDragEnd)(x, y);
        }),
    [handleDragEnd, handleDragStart, dragX, dragY, isDragging]
  );

  const tapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd((event: any) => {
        const { x, y } = event;
        runOnJS(handleTap)(x, y);
      }),
    [handleTap]
  );

  const combinedGesture = useMemo(
    () => Gesture.Race(dragGesture, tapGesture),
    [dragGesture, tapGesture]
  );

  return {
    combinedGesture,
  };
};
