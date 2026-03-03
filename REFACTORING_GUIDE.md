# ChessSurfaceInteractive Refactoring Guide

## Current Issues

The component is ~300 lines and handles:
1. ✅ State management (promotion, sync props to store)
2. ✅ Gesture handling (drag, tap, pan)
3. ✅ Move logic (validation, promotion detection)
4. ✅ Board rendering (squares, pieces, highlights)
5. ✅ Coordinate labels rendering
6. ✅ Promotion dialog management
7. ✅ Debug logging

**Problem:** Single Responsibility Principle violation - too many concerns in one component.

---

## Recommended Structure

```
src/ui/
├── ChessSurfaceInteractive.tsx         (Main component - orchestration only)
├── components/
│   ├── BoardSquare.tsx                  (Individual square rendering)
│   ├── ChessBoard.tsx                   (Board grid + squares)
│   ├── CoordinateLabels.tsx             (Rank/file labels)
│   └── DraggedPiece.tsx                 (Floating dragged piece overlay)
├── hooks/
│   ├── useChessGestures.ts              (Gesture handlers)
│   ├── useChessInteraction.ts           (Move logic, promotion detection)
│   └── useDragState.ts                  (Drag animation state)
└── constants/
    └── pieceImages.ts                   (PIECE_IMAGES constant)
```

---

## Refactoring Steps

### Step 1: Extract Constants

**Create:** `src/ui/constants/pieceImages.ts`

```typescript
import type { ImageSourcePropType } from 'react-native';

export const PIECE_IMAGES: Record<string, ImageSourcePropType> = {
  wK: require('../../assets/chesspieces/wK.png'),
  wQ: require('../../assets/chesspieces/wQ.png'),
  wR: require('../../assets/chesspieces/wR.png'),
  wB: require('../../assets/chesspieces/wB.png'),
  wN: require('../../assets/chesspieces/wN.png'),
  wP: require('../../assets/chesspieces/wP.png'),
  bK: require('../../assets/chesspieces/bK.png'),
  bQ: require('../../assets/chesspieces/bQ.png'),
  bR: require('../../assets/chesspieces/bR.png'),
  bB: require('../../assets/chesspieces/bB.png'),
  bN: require('../../assets/chesspieces/bN.png'),
  bP: require('../../assets/chesspieces/bP.png'),
};
```

---

### Step 2: Extract Board Square Component

**Create:** `src/ui/components/BoardSquare.tsx`

```typescript
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import type { Square } from '../../types/shared';
import { PIECE_IMAGES } from '../constants/pieceImages';

interface BoardSquareProps {
  square: Square;
  piece: any;
  isLight: boolean;
  isSelected: boolean;
  isLegal: boolean;
  isKingInCheck: boolean;
  isDragged?: boolean;
}

export const BoardSquare: React.FC<BoardSquareProps> = ({
  piece,
  isLight,
  isSelected,
  isLegal,
  isKingInCheck,
  isDragged = false,
}) => {
  const bg = isLight ? '#f0d9b5' : '#b58863';
  const pieceImage = piece ? PIECE_IMAGES[`${piece.color}${piece.type.toUpperCase()}`] : null;

  return (
    <View style={[styles.square, { backgroundColor: bg }]}>
      {pieceImage && !isDragged ? (
        <Image source={pieceImage} style={styles.pieceImage} resizeMode="contain" />
      ) : null}
      {isLegal && !isSelected && <View style={styles.legalMoveDot} />}
      {isSelected && <View style={styles.selectedBorder} />}
      {isKingInCheck && <View style={styles.checkBorder} />}
    </View>
  );
};

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
    marginLeft: -6 
  },
  selectedBorder: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0, 
    borderWidth: 3, 
    borderColor: '#d4af37' 
  },
  checkBorder: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0, 
    borderWidth: 3, 
    borderColor: '#ff0000' 
  },
});
```

---

### Step 3: Extract Coordinate Labels Component

**Create:** `src/ui/components/CoordinateLabels.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CoordinateLabelsProps {
  boardSize: number;
  fontSize: number;
}

export const RankLabels: React.FC<CoordinateLabelsProps> = ({ boardSize, fontSize }) => (
  <View style={[styles.rankLabels, { height: boardSize }]}>
    {['8', '7', '6', '5', '4', '3', '2', '1'].map((rank) => (
      <View key={`rank-${rank}`} style={styles.rankLabel}>
        <Text style={[styles.coordinateText, { fontSize }]}>{rank}</Text>
      </View>
    ))}
  </View>
);

export const FileLabels: React.FC<CoordinateLabelsProps & { marginLeft: number }> = ({ 
  boardSize, 
  fontSize,
  marginLeft 
}) => (
  <View style={[styles.fileLabels, { width: boardSize, marginLeft }]}>
    {['a','b','c','d','e','f','g','h'].map((file) => (
      <View key={`file-${file}`} style={styles.fileLabel}>
        <Text style={[styles.coordinateText, { fontSize }]}>{file}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  rankLabels: { 
    flexDirection: 'column', 
    width: 40, 
    marginRight: 4, 
    justifyContent: 'space-around' 
  },
  rankLabel: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: 40 
  },
  fileLabels: { 
    flexDirection: 'row', 
    marginTop: 4 
  },
  fileLabel: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: 20 
  },
  coordinateText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#666' 
  },
});
```

---

### Step 4: Extract Drag State Hook

**Create:** `src/hooks/useDragState.ts`

```typescript
import { useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import type { ImageSourcePropType } from 'react-native';
import type { Square } from '../types/shared';

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
```

---

### Step 5: Extract Interaction Logic Hook

**Create:** `src/hooks/useChessInteraction.ts`

```typescript
import { useCallback, useRef, useEffect } from 'react';
import type { Square } from '../types/shared';
import { useChessStore, type ChessState } from '../store/chessStore';

interface UseChessInteractionProps {
  autoPromoteToQueen: boolean;
  onMove?: (move: { from: string; to: string; promotion?: string }) => void;
}

export const useChessInteraction = ({ 
  autoPromoteToQueen, 
  onMove 
}: UseChessInteractionProps) => {
  const makeMove = useChessStore((s: ChessState) => s.makeMove);
  const setAnimationState = useChessStore((s: ChessState) => s.setAnimationState);
  const getChess = useChessStore((s: ChessState) => s.chess);
  
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  const performMove = useCallback((
    from: Square, 
    to: Square, 
    promotion?: string,
    onPromotion?: (from: Square, to: Square) => void
  ) => {
    // Query legal moves to detect if this is a promotion move
    const legalMoves = getChess.moves({ square: from, verbose: true }) || [];
    const targetMove = legalMoves.find((m: any) => m.to === to);
    
    // Check if this is a promotion move
    if (targetMove && targetMove.flags.includes('p')) {
      if (autoPromoteToQueen) {
        promotion = 'q';
      } else {
        if (!promotion) {
          onPromotion?.(from, to);
          return false;
        }
      }
    }
    
    setAnimationState('animating');
    const success = makeMove(from, to, promotion);
    if (success) {
      onMoveRef.current?.({ from, to, promotion });
    }
    return success;
  }, [makeMove, autoPromoteToQueen, getChess, setAnimationState]);

  return {
    performMove,
  };
};
```

---

### Step 6: Extract Gesture Logic Hook

**Create:** `src/hooks/useChessGestures.ts`

```typescript
import { useCallback, useMemo, useRef, useEffect } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import type { Square } from '../types/shared';
import { pixelToSquare } from '../utils/boardGeometry';
import { useChessStore, chessSelectors, type ChessState } from '../store/chessStore';
import type { DraggedPiece } from './useDragState';
import { PIECE_IMAGES } from '../ui/constants/pieceImages';

interface UseChessGesturesProps {
  boardSize: number;
  orientation: 'white' | 'black';
  dragX: any;
  dragY: any;
  isDragging: any;
  setDraggedPiece: (piece: DraggedPiece | null) => void;
  performMove: (from: Square, to: Square) => void;
}

export const useChessGestures = ({
  boardSize,
  orientation,
  dragX,
  dragY,
  isDragging,
  setDraggedPiece,
  performMove,
}: UseChessGesturesProps) => {
  const selectSquare = useChessStore((s: ChessState) => s.selectSquare);
  const setDraggedSquare = useChessStore((s: ChessState) => s.setDraggedSquare);
  const getChess = useChessStore((s: ChessState) => s.chess);
  const legalMoves = chessSelectors.useLegalMoves();
  const selectedSquare = chessSelectors.useSelectedSquare();

  const selectedSquareRef = useRef<Square | null>(null);
  useEffect(() => {
    selectedSquareRef.current = selectedSquare;
  }, [selectedSquare]);

  const handleDragStart = useCallback((x: number, y: number) => {
    useChessStore.getState().bumpMoveToken();
    const sq = pixelToSquare(x, y, boardSize, boardSize, orientation);
    if (sq) {
      const piece = getChess.get(sq);
      if (piece) {
        const pieceImage = PIECE_IMAGES[`${piece.color}${piece.type.toUpperCase()}`];
        setDraggedPiece({ image: pieceImage, square: sq });
        setDraggedSquare(sq);
      }
      selectSquare(sq);
    }
  }, [boardSize, orientation, selectSquare, getChess, setDraggedSquare, setDraggedPiece]);

  const handleDragEnd = useCallback((x: number, y: number) => {
    const to = pixelToSquare(x, y, boardSize, boardSize, orientation);
    const from = selectedSquareRef.current;
    
    setDraggedPiece(null);
    setDraggedSquare(null);
    
    if (to && from) performMove(from, to);
  }, [boardSize, orientation, performMove, setDraggedSquare, setDraggedPiece]);

  const handleTap = useCallback((x: number, y: number) => {
    useChessStore.getState().bumpMoveToken();
    const sq = pixelToSquare(x, y, boardSize, boardSize, orientation);
    if (!sq) return;
    const from = selectedSquareRef.current;
    if (from && legalMoves.includes(sq)) {
      performMove(from, sq);
    } else {
      selectSquare(sq);
    }
  }, [boardSize, orientation, legalMoves, performMove, selectSquare]);

  const dragGesture = useMemo(() => Gesture.Pan()
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
    })
  , [handleDragEnd, handleDragStart, dragX, dragY, isDragging]);

  const tapGesture = useMemo(() => Gesture.Tap().onEnd((event: any) => {
    const { x, y } = event;
    runOnJS(handleTap)(x, y);
  }), [handleTap]);

  const combinedGesture = useMemo(() => Gesture.Race(dragGesture, tapGesture), [dragGesture, tapGesture]);

  return {
    combinedGesture,
    handleTap,
  };
};
```

---

### Step 7: Extract Dragged Piece Overlay Component

**Create:** `src/ui/components/DraggedPiece.tsx`

```typescript
import React from 'react';
import { Image } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { DraggedPiece as DraggedPieceType } from '../../hooks/useDragState';

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
        style={{ width: '100%', height: '100%' }} 
        resizeMode="contain" 
      />
    </Animated.View>
  );
};
```

---

### Step 8: Refactored Main Component

**Updated:** `src/ui/ChessSurfaceInteractive.tsx`

```typescript
import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView, GestureDetector } from 'react-native-gesture-handler';
import type { FenString, Square } from '../types/shared';
import { indicesToSquare } from '../utils/boardGeometry';
import { useChessStore, chessSelectors, type ChessState } from '../store/chessStore';
import { useResponsiveCoordinateSize } from '../hooks/useResponsiveSize';
import { useDragState } from '../hooks/useDragState';
import { useChessInteraction } from '../hooks/useChessInteraction';
import { useChessGestures } from '../hooks/useChessGestures';
import ArrowOverlay from './ArrowOverlay';
import PromotionDialog from './PromotionDialog';
import { BoardSquare } from './components/BoardSquare';
import { RankLabels, FileLabels } from './components/CoordinateLabels';
import { DraggedPiece } from './components/DraggedPiece';

interface ChessSurfaceInteractiveProps {
  position?: FenString;
  orientation?: 'white' | 'black';
  boardSize?: number;
  showCoordinates?: boolean;
  autoPromoteToQueen?: boolean;
  onMove?: (move: { from: string; to: string; promotion?: string }) => void;
}

export default function ChessSurfaceInteractive({ 
  position = 'start', 
  orientation = 'white', 
  boardSize = 320, 
  showCoordinates = false, 
  autoPromoteToQueen = true, 
  onMove 
}: ChessSurfaceInteractiveProps) {
  // State
  const [promotionData, setPromotionData] = React.useState<{ 
    from: Square; 
    to: Square; 
    color: 'w' | 'b' 
  } | null>(null);

  // Drag state
  const { dragX, dragY, isDragging, draggedPiece, setDraggedPiece } = useDragState();

  // Store sync
  const setPosition = useChessStore((s: ChessState) => s.setPosition);
  const setAutoPromoteToQueen = useChessStore((s: ChessState) => s.setAutoPromoteToQueen);

  React.useEffect(() => {
    setAutoPromoteToQueen(autoPromoteToQueen);
  }, [autoPromoteToQueen, setAutoPromoteToQueen]);

  React.useEffect(() => {
    if (position !== undefined) setPosition(position);
  }, [position, setPosition]);

  // Selectors
  const board = chessSelectors.useBoard();
  const selectedSquare = chessSelectors.useSelectedSquare();
  const legalMoves = chessSelectors.useLegalMoves();
  const storeOrientation = chessSelectors.useOrientation();
  const arrows = chessSelectors.useArrows();
  const isCheck = chessSelectors.useIsCheck();
  const isCheckmate = chessSelectors.useIsCheckmate();
  const kingSquare = chessSelectors.useKingSquare();

  const effectiveOrientation = orientation !== 'white' ? orientation : storeOrientation;
  const squareSize = boardSize / 8;

  // Interaction logic
  const { performMove } = useChessInteraction({
    autoPromoteToQueen,
    onMove,
  });

  const handlePromotion = React.useCallback((from: Square, to: Square) => {
    const getChess = useChessStore.getState().chess;
    const piece = getChess.get(from);
    setPromotionData({ from, to, color: piece?.color as 'w' | 'b' || 'w' });
  }, []);

  const wrappedPerformMove = React.useCallback((from: Square, to: Square, promotion?: string) => {
    return performMove(from, to, promotion, handlePromotion);
  }, [performMove, handlePromotion]);

  // Gestures
  const { combinedGesture } = useChessGestures({
    boardSize,
    orientation: effectiveOrientation,
    dragX,
    dragY,
    isDragging,
    setDraggedPiece,
    performMove: wrappedPerformMove,
  });

  // Promotion handlers
  const handlePromotionSelect = React.useCallback((piece: 'q' | 'r' | 'b' | 'n') => {
    if (promotionData) {
      const { from, to } = promotionData;
      setPromotionData(null);
      performMove(from, to, piece);
    }
  }, [promotionData, performMove]);

  const handlePromotionCancel = React.useCallback(() => {
    setPromotionData(null);
  }, []);

  const coordinateFontSize = useResponsiveCoordinateSize();

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          {showCoordinates && (
            <RankLabels boardSize={boardSize} fontSize={coordinateFontSize} />
          )}

          <GestureDetector gesture={combinedGesture}>
            <View style={[styles.boardContainer, { width: boardSize, height: boardSize }]}>
              <View style={[styles.board, { width: boardSize, height: boardSize }]}>
                {board.map((rank: any, rIdx: number) => (
                  <View key={`r-${rIdx}`} style={styles.row}>
                    {rank.map((sq: any, fIdx: number) => {
                      const isLight = (rIdx + fIdx) % 2 === 0;
                      const squareNotation = indicesToSquare(rIdx, fIdx, effectiveOrientation);
                      const isSelected = selectedSquare === squareNotation;
                      const isLegal = legalMoves.includes(squareNotation);
                      const isKingInCheck = (isCheck || isCheckmate) && squareNotation === kingSquare;
                      const isDraggedSquare = draggedPiece?.square === squareNotation;

                      return (
                        <BoardSquare
                          key={`s-${rIdx}-${fIdx}`}
                          square={squareNotation}
                          piece={sq}
                          isLight={isLight}
                          isSelected={isSelected}
                          isLegal={isLegal}
                          isKingInCheck={isKingInCheck}
                          isDragged={isDraggedSquare}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
              
              <ArrowOverlay 
                arrows={arrows} 
                boardWidth={boardSize} 
                boardHeight={boardSize} 
                orientation={effectiveOrientation} 
              />
              
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

        {promotionData && (
          <PromotionDialog
            visible={!!promotionData}
            color={promotionData.color}
            onSelect={handlePromotionSelect}
            onCancel={handlePromotionCancel}
          />
        )}

        {showCoordinates && (
          <FileLabels 
            boardSize={boardSize} 
            fontSize={coordinateFontSize}
            marginLeft={40}
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
  board: { width: 320, height: 320 },
  row: { flexDirection: 'row', flex: 1 },
});
```

---

## Benefits of Refactoring

### ✅ Single Responsibility
- **ChessSurfaceInteractive**: Orchestration only
- **BoardSquare**: Square rendering
- **CoordinateLabels**: Label rendering
- **DraggedPiece**: Drag overlay
- **useDragState**: Drag state management
- **useChessInteraction**: Move logic
- **useChessGestures**: Gesture handling

### ✅ Testability
Each piece can be tested independently:
```typescript
// Test gesture logic without rendering
const { result } = renderHook(() => useChessGestures({...}));

// Test square rendering
render(<BoardSquare isLight={true} ... />);
```

### ✅ Reusability
Components can be reused:
```typescript
// Use BoardSquare in different contexts
<BoardSquare piece={...} isLight={true} />

// Use gestures in different board implementations
const gestures = useChessGestures({...});
```

### ✅ Maintainability
- Changes are localized
- Easier to understand each piece
- Clearer dependencies

### ✅ Performance
- Can memoize individual components
- Easier to identify re-render issues

---

## Migration Strategy

### Option 1: Big Bang (Not Recommended)
Replace everything at once - risky

### Option 2: Incremental (Recommended)

**Week 1: Extract Constants & Hooks**
1. Create `pieceImages.ts`
2. Create `useDragState.ts`
3. Update ChessSurfaceInteractive to use them
4. Test thoroughly

**Week 2: Extract Components**
1. Create `BoardSquare.tsx`
2. Create `CoordinateLabels.tsx`
3. Update ChessSurfaceInteractive to use them
4. Test thoroughly

**Week 3: Extract Remaining Logic**
1. Create `useChessInteraction.ts`
2. Create `useChessGestures.ts`
3. Create `DraggedPiece.tsx`
4. Final cleanup of ChessSurfaceInteractive
5. Full regression testing

---

## File Size Comparison

**Before:**
- ChessSurfaceInteractive.tsx: ~300 lines

**After:**
- ChessSurfaceInteractive.tsx: ~150 lines ✅
- BoardSquare.tsx: ~60 lines
- CoordinateLabels.tsx: ~50 lines
- DraggedPiece.tsx: ~40 lines
- useDragState.ts: ~20 lines
- useChessInteraction.ts: ~50 lines
- useChessGestures.ts: ~100 lines
- pieceImages.ts: ~15 lines

**Total: ~485 lines** (but much better organized!)

---

## Should You Do This?

### ✅ Yes, if:
- You plan to add more features
- Multiple developers work on the codebase
- You need better testing coverage
- The component keeps growing

### ❌ No, if:
- This is a one-off project
- You're the only developer
- Component is stable and unlikely to change
- Time is very constrained

---

## Recommendation

**Start with Step 1-3** (constants + simple components):
- Low risk
- Immediate benefits
- Easy to test
- Good foundation for future work

Then decide if further refactoring is worth it based on:
- How often you modify this code
- Team size
- Project longevity
