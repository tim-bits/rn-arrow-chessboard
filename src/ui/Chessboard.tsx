import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  GestureHandlerRootView,
  GestureDetector,
} from 'react-native-gesture-handler';
import type { FenString, Square } from '../types/shared';
import { indicesToSquare, squareToPixel } from '../utils/boardGeometry';
import { useChessStore, chessSelectors, type ChessState } from '../store/chessStore';
import { useResponsiveCoordinateSize } from '../hooks/useResponsiveSize';
import { RankLabels, FileLabels } from './components/CoordinateLabels';
import { DraggedPiece } from './components/DraggedPiece';
import { useChessOrchestration } from './hooks/useChessOrchestration';
import BoardView from './components/BoardView';
import MoveOverlay from './components/MoveOverlay';
import ArrowOverlay from './ArrowOverlay';
import PromotionDialog from './PromotionDialog';
import { PIECE_IMAGES } from './constants/pieceImages';
import { log } from '../utils/log';

// Memoized helper to avoid recalculating per render
const getSquareNotation = (
  rIdx: number,
  fIdx: number,
  orientation: 'white' | 'black'
) => indicesToSquare(rIdx, fIdx, orientation);

export default function Chessboard({
  position = 'start',
  orientation = 'white',
  boardSize = 320,
  showCoordinates = false,
  autoPromoteToQueen = true,
  arrowColor,
  onMove,
  onUserInteraction,
}: {
  position?: FenString;
  orientation?: 'white' | 'black';
  boardSize?: number;
  showCoordinates?: boolean;
  autoPromoteToQueen?: boolean;
  moveAnimationDuration?: number;
  arrowColor?: string;
  onMove?: (move: { from: string; to: string; promotion?: string }) => void;
  onUserInteraction?: () => boolean | void;
}) {
  // Promotion dialog state
  const [promotionData, setPromotionData] = React.useState<{
    from: Square;
    to: Square;
    color: 'w' | 'b';
  } | null>(null);

  // Sync position prop to store
  const setPosition = useChessStore((s: ChessState) => s.setPosition);
  const setAutoPromoteToQueen = useChessStore(
    (s: ChessState) => s.setAutoPromoteToQueen
  );
  const setArrowColor = useChessStore((s: ChessState) => s.setArrowColor);
  // const setMoveAnimationDuration = useChessStore((s: ChessState) => s.setMoveAnimationDuration);

  // Sync autoPromoteToQueen prop to store so orchestration hook can access it
  React.useEffect(() => {
    log(
      '[Chessboard] Setting autoPromoteToQueen to store:',
      autoPromoteToQueen
    );
    setAutoPromoteToQueen(autoPromoteToQueen);
  }, [autoPromoteToQueen, setAutoPromoteToQueen]);

  // Sync arrowColor prop to store
  React.useEffect(() => {
    if (arrowColor !== undefined) {
      log(
        '[Chessboard] Setting arrowColor to store:',
        arrowColor
      );
      setArrowColor(arrowColor);
    }
  }, [arrowColor, setArrowColor]);

  React.useEffect(() => {
    if (position !== undefined) {
      setPosition(position);
    }
  }, [position, setPosition]);

  const storeOrientation = chessSelectors.useOrientation();

  // Normalize board size to avoid fractional pixels that cause hairline gaps
  const normalizedBoardSize = Math.floor(boardSize / 8) * 8;
  const effectiveBoardSize =
    normalizedBoardSize > 0 ? normalizedBoardSize : boardSize;

  // Use prop orientation or store orientation (prop takes precedence)
  const effectiveOrientation =
    orientation !== 'white' ? orientation : storeOrientation;

  const handlePromotion = React.useCallback((from: Square, to: Square) => {
    const getChess = useChessStore.getState().chess;
    log('[performMove] Showing promotion dialog for', from, to);
    const piece = getChess.get(from);
    setPromotionData({ from, to, color: (piece?.color as 'w' | 'b') || 'w' });
  }, []);

  const {
    board,
    animatingMove,
    selectedSquare,
    legalMovesSet,
    arrows,
    arrowColorFromStore,
    isCheck,
    isCheckmate,
    isStalemate,
    kingSquare,
    dragX,
    dragY,
    isDragging,
    isDraggingFlag,
    draggedPiece,
    animatedMove,
    movePieceStyle,
    combinedGesture,
    handleUserInteraction,
    performMove,
  } = useChessOrchestration({
    effectiveBoardSize,
    effectiveOrientation,
    autoPromoteToQueen,
    onMove,
    onUserInteraction,
    handlePromotion,
  });

  // Calculate square size for drag animation
const squareSize = effectiveBoardSize / 8;

// Memoize board rows to limit rerenders of 64 squares when props are stable
const memoizedRows = React.useMemo(() => {
  return board.map((rank: any, rIdx: number) => {
    return rank.map((sq: any, fIdx: number) => {
      const squareNotation = getSquareNotation(rIdx, fIdx, effectiveOrientation);
      const isLight = (rIdx + fIdx) % 2 === 0;
      const pieceKey = sq ? `${sq.color}${sq.type}_${squareNotation}` : null;
      const pieceImage = sq
        ? PIECE_IMAGES[`${sq.color}${sq.type.toUpperCase()}`]
        : null;
      return {
        key: `s-${rIdx}-${fIdx}`,
        squareNotation,
        isLight,
        pieceKey,
        pieceImage,
      };
    });
  });
}, [board, effectiveOrientation]);

  const capturedOverlay = animatedMove?.captured;
  const capturedOverlayPos = React.useMemo(() => {
    if (!capturedOverlay) return null;
    const [centerX, centerY] = squareToPixel(
      capturedOverlay.square,
      effectiveBoardSize,
      effectiveBoardSize,
      effectiveOrientation
    );
    return {
      left: centerX - squareSize / 2,
      top: centerY - squareSize / 2,
    };
  }, [capturedOverlay, effectiveBoardSize, effectiveOrientation, squareSize]);

  const handlePromotionSelect = React.useCallback(
    (piece: 'q' | 'r' | 'b' | 'n') => {
      if (promotionData) {
        const { from, to } = promotionData;
        setPromotionData(null);
        performMove(from, to, piece);
      }
    },
    [promotionData, performMove]
  );

  const handlePromotionCancel = React.useCallback(() => {
    setPromotionData(null);
  }, []);

  // Responsive coordinate font size
  const coordinateFontSize = useResponsiveCoordinateSize();

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          {/* Rank labels on left */}
          {showCoordinates && (
            <RankLabels
              boardSize={effectiveBoardSize}
              fontSize={coordinateFontSize}
            />
          )}

          {/* Board */}
          <GestureDetector gesture={combinedGesture}>
            <View
              style={[
                styles.boardContainer,
                {
                  width: effectiveBoardSize,
                  height: effectiveBoardSize,
                } as any,
              ]}
            >
              <BoardView
                style={{
                  width: effectiveBoardSize,
                  height: effectiveBoardSize,
                } as any}
                rows={memoizedRows}
                selectedSquare={selectedSquare}
                legalMovesSet={legalMovesSet}
                isCheck={isCheck}
                isCheckmate={isCheckmate}
                isStalemate={isStalemate}
                kingSquare={kingSquare}
                draggedSquare={draggedPiece?.square || null}
                animatedFrom={animatedMove?.from || null}
                animatedTo={animatedMove?.to || null}
                disablePop={isDraggingFlag}
              />
              <ArrowOverlay
                arrows={arrows}
                boardWidth={effectiveBoardSize}
                boardHeight={effectiveBoardSize}
                orientation={effectiveOrientation}
                arrowStyle={{ color: arrowColorFromStore }}
              />

              <MoveOverlay
                squareSize={squareSize}
                animatedMove={animatedMove}
                capturedOverlayPos={capturedOverlayPos}
                movePieceStyle={movePieceStyle}
              />

              {/* Dragged piece overlay */}
              <DraggedPiece
                draggedPiece={draggedPiece}
                dragX={dragX}
                dragY={dragY}
                isDragging={isDragging}
                squareSize={squareSize}
              />
            </View>
          </GestureDetector>
        </View>

        {/* Promotion Dialog */}
        {promotionData && (
          <PromotionDialog
            visible={!!promotionData}
            color={promotionData.color}
            onSelect={handlePromotionSelect}
            onCancel={handlePromotionCancel}
          />
        )}

        {/* File labels below */}
        {showCoordinates && (
          <FileLabels
            boardSize={effectiveBoardSize}
            fontSize={coordinateFontSize}
            marginLeft={showCoordinates ? 40 : 0}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  container: { alignItems: 'center', justifyContent: 'center' },
  contentArea: { flexDirection: 'row', alignItems: 'flex-end' },
  boardContainer: { position: 'relative' },
});

