import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
import { Chess } from 'chess.js';
import type { Square, FenString, ArrowPair } from '../types/shared';
import { log, warn, error as logError } from '../utils/log';

export type { ArrowPair };

export type AnimationState = 'idle' | 'animating' | 'arrowsUpdating';

export type LastMove = {
  from: Square;
  to: Square;
  san?: string;
  color?: 'w' | 'b';
  piece?: string;
  captured?: string;
  promotion?: string;
  flags?: string;
};

export type MoveHistoryEntry = {
  from: Square;
  to: Square;
  san: string;
  color?: 'w' | 'b';
  piece?: string;
  captured?: string;
  promotion?: string;
  flags?: string;
};

export type MoveRequestResult = 'started' | 'queued' | 'rejected';

export type MoveRequestOptions = {
  allowQueue?: boolean;
  flushIfAnimating?: boolean;
  clearQueue?: boolean;
  startOverlayIntent?: boolean;
};

export type QueuedMove = {
  from: Square;
  to: Square;
  promotion?: string;
  startOverlayIntent?: boolean;
};

// ============================================================================
// STEP 1 ADDITION: Animation state to hold before/after positions
// ============================================================================
export type AnimatingMove = {
  fromPosition: Chess; // Position BEFORE the move
  toPosition: Chess; // Position AFTER the move
  moveData: {
    from: Square;
    to: Square;
    san: string;
    color: 'w' | 'b';
    piece: string;
    captured?: string;
    promotion?: string;
    flags?: string;
  };
} | null;

export interface ChessState {
  // NEW: Pending updates to apply when animation completes
  pendingBoardUpdate: {
    chess: Chess;
    fen: FenString;
    board: ReturnType<Chess['board']>;
    positions: Chess[];
    currentPositionIndex: number;
    lastMove: LastMove;
    moveHistory: MoveHistoryEntry[];
    isCheck: boolean;
    isCheckmate: boolean;
    isStalemate: boolean;
    isDraw: boolean;
    turn: 'w' | 'b';
    kingSquare: Square | null;
  } | null;

  // NEW: Method to complete animation
  completeAnimation: () => void;

  // NEW: Move queueing
  queuedMoves: QueuedMove[];
    requestMove: (
      from: Square,
      to: Square,
      promotion?: string,
      options?: MoveRequestOptions
    ) => MoveRequestResult;
  processQueue: () => void;

  // Demo guard (survives StrictMode remounts)
  demoHasRun: boolean;
  setDemoHasRun: (value: boolean) => void;

  // ============================================================================
  // UNCHANGED: Keep existing chess instance for backward compatibility
  // ============================================================================
  chess: Chess;
  fen: FenString;
  board: ReturnType<Chess['board']>;
  isControlled: boolean;

  selectedSquare: Square | null;
  draggedSquare: Square | null;
  legalMoves: Square[];

  lastMove: LastMove | null;
  moveHistory: MoveHistoryEntry[];

  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  turn: 'w' | 'b';
  kingSquare: Square | null;

  orientation: 'white' | 'black';
  promotionSquare: Square | null;
  arrows: ArrowPair[];
  animationState: AnimationState;
  moveAnimationDuration: number;
  arrowDisplayDuration: number;
  arrowColor: string;
  autoPromoteToQueen: boolean;
  moveToken: number;
  overlayIntent: { from: Square; to: Square } | null;

  // ============================================================================
  // STEP 1 ADDITIONS: Immutable position history
  // ============================================================================
  positions: Chess[]; // Array of all positions (immutable)
  currentPositionIndex: number; // Which position we're viewing
  animatingMove: AnimatingMove; // Holds before/after for animation

  // ============================================================================
  // UNCHANGED: Keep all existing method signatures
  // ============================================================================
  setPosition: (fen: FenString, isControlled?: boolean) => void;
  selectSquare: (square: Square | null) => void;
  setDraggedSquare: (square: Square | null) => void;
  makeMove: (from: Square, to: Square, promotion?: string) => boolean;
  setLastMove: (from: Square, to: Square) => void;
  setOrientation: (orientation: 'white' | 'black') => void;
  setPromotionSquare: (square: Square | null) => void;
  setArrows: (arrows: ArrowPair[]) => void;
  clearArrows: () => void;
  setAnimationState: (state: AnimationState) => void;
  setMoveAnimationDuration: (duration: number) => void;
  setArrowDisplayDuration: (duration: number) => void;
  setArrowColor: (color: string) => void;
  setAutoPromoteToQueen: (auto: boolean) => void;
  bumpMoveToken: () => number;
  setOverlayIntent: (intent: { from: Square; to: Square } | null) => void;
  reset: () => void;
  undo: () => boolean;
  redo: () => boolean;

  // ============================================================================
  // STEP 1 ADDITIONS: New navigation methods
  // ============================================================================
  goToPosition: (index: number) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const createInitialChess = (fen?: FenString): Chess => {
  if (!fen || fen === 'start') return new Chess();
  try {
    return new Chess(fen);
  } catch (err) {
    warn('[ChessStore] Invalid FEN, using start position:', err);
    return new Chess();
  }
};

const findKingSquare = (chess: Chess, kingColor: 'w' | 'b'): Square | null => {
  const board = chess.board();
  for (let rIdx = 0; rIdx < board.length; rIdx++) {
    const row = board[rIdx];
    if (!row) continue;
    for (let fIdx = 0; fIdx < row.length; fIdx++) {
      const piece = row[fIdx];
      if (piece && piece.type === 'k' && piece.color === kingColor) {
        return `${String.fromCharCode(97 + fIdx)}${8 - rIdx}` as Square;
      }
    }
  }
  return null;
};

const getGameState = (chess: Chess) => {
  const isCheck = chess.isCheck();
  const isCheckmate = chess.isCheckmate();
  const turn = chess.turn();

  let kingSquare: Square | null = null;
  if (isCheck || isCheckmate) {
    kingSquare = findKingSquare(chess, turn);
  }

  return {
    isCheck,
    isCheckmate,
    isStalemate: chess.isStalemate(),
    isDraw: chess.isDraw(),
    turn,
    kingSquare,
  };
};

export const useChessStore = create<ChessState>((set: any, get: any) => {
  const initialChess = createInitialChess();

  return {
    // ============================================================================
    // UNCHANGED: All existing state initialization
    // ============================================================================
    chess: initialChess,
    fen: 'start',
    board: initialChess.board(),
    isControlled: false,

    selectedSquare: null,
    draggedSquare: null,
    legalMoves: [],

    lastMove: null,
    moveHistory: [],

    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    turn: 'w',
    kingSquare: null,
    orientation: 'white',
    promotionSquare: null,
    arrows: [],
    animationState: 'idle',
    moveAnimationDuration: 300,
    arrowDisplayDuration: 500,
    arrowColor: '#FFD700',
    autoPromoteToQueen: true,
    moveToken: 0,
    overlayIntent: null,

    // ============================================================================
    // STEP 1 ADDITIONS: Initialize position history
    // ============================================================================
    positions: [initialChess], // Start with initial position
    currentPositionIndex: 0,
    animatingMove: null,

    queuedMoves: [],
    pendingBoardUpdate: null, // NEW

    demoHasRun: false,

    // ============================================================================
    // MINIMALLY CHANGED: setPosition now also updates positions array
    // ============================================================================
    setPosition: (fen: FenString, isControlled = false) => {
      const current = get();
      const chess = createInitialChess(fen);
      const newFen = chess.fen();

      if (current.fen === newFen) {
        if (current.isControlled !== isControlled) set({ isControlled });
        return;
      }

      const gameState = getGameState(chess);
      const board = chess.board();

      set({
        chess,
        fen: newFen,
        board,
        isControlled,
        selectedSquare: null,
        draggedSquare: null,
        legalMoves: [],
        promotionSquare: null,
        arrows: [],
        animationState: 'idle',
        isCheck: gameState.isCheck,
        isCheckmate: gameState.isCheckmate,
        isStalemate: gameState.isStalemate,
        isDraw: gameState.isDraw,
        turn: gameState.turn,
        kingSquare: gameState.kingSquare,
        // ADDED: Reset position history when loading new position
        positions: [chess],
        currentPositionIndex: 0,
        animatingMove: null,
        queuedMoves: [],
      });
    },

    // ============================================================================
    // UNCHANGED: Selection logic stays the same
    // ============================================================================
    selectSquare: (square: Square | null) => {
      const { chess, selectedSquare, legalMoves: currentLegalMoves } = get();

      if (square === selectedSquare) {
        if (selectedSquare !== null)
          set({ selectedSquare: null, legalMoves: [] });
        return;
      }

      if (!square) {
        if (selectedSquare !== null || currentLegalMoves.length > 0)
          set({ selectedSquare: null, legalMoves: [] });
        return;
      }

      const moves = chess.moves({ square, verbose: true }) || [];
      const newLegalMoves = moves.map((m: any) => m.to as Square);

      const legalMovesChanged =
        currentLegalMoves.length !== newLegalMoves.length ||
        currentLegalMoves.some(
          (mv: Square, idx: number) => mv !== newLegalMoves[idx]
        );

      if (selectedSquare !== square || legalMovesChanged) {
        set({ selectedSquare: square, legalMoves: newLegalMoves });
      }
    },

    setDraggedSquare: (square: Square | null) => {
      const cur = get();
      if (cur.draggedSquare !== square) set({ draggedSquare: square });
    },

    // ============================================================================
    // CRITICAL CHANGE: makeMove now creates immutable positions
    // ============================================================================
    makeMove: (from: Square, to: Square, promotion?: string) => {
      const { positions, currentPositionIndex } = get();
      const currentPosition = positions[currentPositionIndex];

      try {
        log(`[ChessStore.makeMove] Attempting: ${from}-${to}`);

        // Validate move
        const legalMoves =
          currentPosition.moves({ square: from, verbose: true }) || [];
        const isLegal = legalMoves.some((m: any) => m.to === to);
        if (!isLegal) {
          warn(`[ChessStore.makeMove] Illegal move ignored: ${from}-${to}`);
          return false;
        }

        // Create NEW chess instance (immutable)
        const newPosition = new Chess(currentPosition.fen());
        const mv = newPosition.move({ from, to, promotion: promotion as any });

        if (!mv) {
          log(`[ChessStore.makeMove] Invalid move: ${from}-${to}`);
          return false;
        }

        const gameState = getGameState(newPosition);
        const newHistory = [
          ...get().moveHistory,
          {
            from,
            to,
            san: mv.san,
            color: mv.color,
            piece: mv.piece,
            captured: mv.captured,
            promotion: mv.promotion,
            flags: mv.flags,
          },
        ];

        const newPositions = [
          ...positions.slice(0, currentPositionIndex + 1),
          newPosition,
        ];

        // ========================================================================
        // CRITICAL CHANGE: Set animatingMove IMMEDIATELY
        // DO NOT update board/positions yet - wait for animation to complete
        // ========================================================================
        set({
          animatingMove: {
            fromPosition: currentPosition,
            toPosition: newPosition,
            moveData: {
              from,
              to,
              san: mv.san,
              color: mv.color,
              piece: mv.piece,
              captured: mv.captured,
              promotion: mv.promotion,
              flags: mv.flags,
            },
          },
          // Store the pending updates but don't apply them yet
          pendingBoardUpdate: {
            chess: newPosition,
            fen: newPosition.fen(),
            board: newPosition.board(),
            positions: newPositions,
            currentPositionIndex: newPositions.length - 1,
            lastMove: {
              from,
              to,
              san: mv.san,
              color: mv.color,
              piece: mv.piece,
              captured: mv.captured,
              promotion: mv.promotion,
              flags: mv.flags,
            },
            moveHistory: newHistory,
            isCheck: gameState.isCheck,
            isCheckmate: gameState.isCheckmate,
            isStalemate: gameState.isStalemate,
            isDraw: gameState.isDraw,
            turn: gameState.turn,
            kingSquare: gameState.kingSquare,
          },
        });

        return true;
      } catch (err) {
        logError(`[ChessStore.makeMove] Error: ${err}`);
        return false;
      }
    },

    requestMove: (
      from: Square,
      to: Square,
      promotion?: string,
      options?: MoveRequestOptions
    ) => {
      const allowQueue = options?.allowQueue !== false;
      const flushIfAnimating = options?.flushIfAnimating === true;
      const clearQueue = options?.clearQueue === true;
      const startOverlayIntent = options?.startOverlayIntent === true;
      const { animatingMove, pendingBoardUpdate, queuedMoves } = get();

      if (animatingMove || pendingBoardUpdate) {
        if (flushIfAnimating) {
          if (pendingBoardUpdate) {
            get().completeAnimation();
          } else if (animatingMove) {
            set({ animatingMove: null });
          }
          if (clearQueue && get().queuedMoves.length > 0) {
            set({ queuedMoves: [] });
          }
          if (startOverlayIntent) {
            set({ overlayIntent: { from, to } });
          }
          const started = get().makeMove(from, to, promotion);
          return started ? 'started' : 'rejected';
        }

        if (allowQueue) {
          set({
            queuedMoves: [
              ...queuedMoves,
              { from, to, promotion, startOverlayIntent },
            ],
          });
          return 'queued';
        }
        return 'rejected';
      }

      if (clearQueue && queuedMoves.length > 0) {
        set({ queuedMoves: [] });
      }

      if (startOverlayIntent) {
        set({ overlayIntent: { from, to } });
      }

      const started = get().makeMove(from, to, promotion);
      return started ? 'started' : 'rejected';
    },

    processQueue: () => {
      const { animatingMove, pendingBoardUpdate, queuedMoves } = get();

      if (animatingMove || pendingBoardUpdate || queuedMoves.length === 0) {
        return;
      }

      let remaining = [...queuedMoves];
      while (remaining.length > 0) {
        const next = remaining.shift();
        if (!next) break;
        if (next.startOverlayIntent) {
          set({ overlayIntent: { from: next.from, to: next.to } });
        }
        const started = get().makeMove(next.from, next.to, next.promotion);
        if (started) {
          set({ queuedMoves: remaining });
          return;
        }
      }

      set({ queuedMoves: [] });
    },

    setDemoHasRun: (value: boolean) => {
      set({ demoHasRun: value });
    },

    completeAnimation: () => {
      const { pendingBoardUpdate } = get();

      if (!pendingBoardUpdate) {
        warn('[Store] completeAnimation called but no pending update');
        return;
      }

      log(
        '[Store] Completing animation, applying pending updates',
        `t=${Date.now()}`
      );

      set({
        ...pendingBoardUpdate,
        animatingMove: null,
        pendingBoardUpdate: null,
        selectedSquare: null,
        legalMoves: [],
        draggedSquare: null,
        promotionSquare: null,
      });
    },

    // ============================================================================
    // UNCHANGED: All other setters
    // ============================================================================
    setLastMove: (from: Square, to: Square) => set({ lastMove: { from, to } }),
    setOrientation: (orientation: 'white' | 'black') => set({ orientation }),
    setPromotionSquare: (square: Square | null) =>
      set({ promotionSquare: square }),
    setArrows: (arrows: ArrowPair[]) => set({ arrows }),
      clearArrows: () => set({ arrows: [] }),
      setAnimationState: (state: AnimationState) =>
        set({ animationState: state }),
      setMoveAnimationDuration: (duration: number) =>
        set({ moveAnimationDuration: duration }),
    setArrowDisplayDuration: (duration: number) =>
      set({ arrowDisplayDuration: duration }),
    setArrowColor: (color: string) => set({ arrowColor: color }),
    setAutoPromoteToQueen: (auto: boolean) => set({ autoPromoteToQueen: auto }),
    setOverlayIntent: (intent: { from: Square; to: Square } | null) =>
      set({ overlayIntent: intent }),

    // ============================================================================
    // UPDATED: reset() now resets position history too
    // ============================================================================
    reset: () => {
      const chess = new Chess();
      const gameState = getGameState(chess);
      const board = chess.board();
      set({
        chess,
        fen: chess.fen(),
        board,
        selectedSquare: null,
        draggedSquare: null,
        legalMoves: [],
        lastMove: null,
        moveHistory: [],
        promotionSquare: null,
        arrows: [],
        animationState: 'idle',
        isCheck: gameState.isCheck,
        isCheckmate: gameState.isCheckmate,
        isStalemate: gameState.isStalemate,
        isDraw: gameState.isDraw,
        turn: gameState.turn,
        kingSquare: gameState.kingSquare,
        // ADDED: Reset position history
        positions: [chess],
        currentPositionIndex: 0,
        animatingMove: null,
        queuedMoves: [],
      });
    },

    // ============================================================================
    // UPDATED: undo() now uses position history (much simpler!)
    // ============================================================================
    undo: () => {
      const { currentPositionIndex, positions, moveHistory } = get();

      if (currentPositionIndex === 0) return false;

      const newIndex = currentPositionIndex - 1;
      const previousPosition = positions[newIndex];
      const gameState = getGameState(previousPosition);
      const board = previousPosition.board();
      const newHistory = moveHistory.slice(0, -1);
      const lastMove =
        newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;

      set({
        chess: previousPosition,
        fen: previousPosition.fen(),
        board,
        currentPositionIndex: newIndex,
        moveHistory: newHistory,
        lastMove: lastMove ? { ...lastMove } : null,
        selectedSquare: null,
        legalMoves: [],
        draggedSquare: null,
        promotionSquare: null,
        arrows: [],
        animationState: 'idle',
        isCheck: gameState.isCheck,
        isCheckmate: gameState.isCheckmate,
        isStalemate: gameState.isStalemate,
        isDraw: gameState.isDraw,
        turn: gameState.turn,
        kingSquare: gameState.kingSquare,
        queuedMoves: [],
      });

      return true;
    },

    // ============================================================================
    // NEW: redo() now actually works!
    // ============================================================================
    redo: () => {
      const { currentPositionIndex, positions, moveHistory } = get();

      if (currentPositionIndex >= positions.length - 1) return false;

      const newIndex = currentPositionIndex + 1;
      const nextPosition = positions[newIndex];
      const gameState = getGameState(nextPosition);
      const board = nextPosition.board();

      // Restore the move that was redone
      const redoneMove = moveHistory[newIndex];

      set({
        chess: nextPosition,
        fen: nextPosition.fen(),
        board,
        currentPositionIndex: newIndex,
        lastMove: redoneMove ? { ...redoneMove } : null,
        selectedSquare: null,
        legalMoves: [],
        draggedSquare: null,
        promotionSquare: null,
        arrows: [],
        animationState: 'idle',
        isCheck: gameState.isCheck,
        isCheckmate: gameState.isCheckmate,
        isStalemate: gameState.isStalemate,
        isDraw: gameState.isDraw,
        turn: gameState.turn,
        kingSquare: gameState.kingSquare,
        queuedMoves: [],
      });

      return true;
    },

    bumpMoveToken: () => {
      const next = get().moveToken + 1;
      set({ moveToken: next });
      return next;
    },

    // ============================================================================
    // NEW METHODS: Position navigation
    // ============================================================================
    goToPosition: (index: number) => {
      const { positions, moveHistory } = get();

      if (index < 0 || index >= positions.length) {
        warn('[ChessStore] Invalid position index:', index);
        return;
      }

      const targetPosition = positions[index];
      const gameState = getGameState(targetPosition);
      const board = targetPosition.board();
      const lastMove = index > 0 ? moveHistory[index - 1] : null;

      set({
        chess: targetPosition,
        fen: targetPosition.fen(),
        board,
        currentPositionIndex: index,
        lastMove: lastMove ? { ...lastMove } : null,
        selectedSquare: null,
        legalMoves: [],
        draggedSquare: null,
        promotionSquare: null,
        arrows: [],
        animationState: 'idle',
        isCheck: gameState.isCheck,
        isCheckmate: gameState.isCheckmate,
        isStalemate: gameState.isStalemate,
        isDraw: gameState.isDraw,
        turn: gameState.turn,
        kingSquare: gameState.kingSquare,
        queuedMoves: [],
      });
    },

    canUndo: () => {
      return get().currentPositionIndex > 0;
    },

    canRedo: () => {
      const { currentPositionIndex, positions } = get();
      return currentPositionIndex < positions.length - 1;
    },
  };
});

// ============================================================================
// MOSTLY UNCHANGED: Selectors stay the same, just add new ones
// ============================================================================
export const chessSelectors = {
  useFen: () => useChessStore((s: ChessState) => s.fen),
  useChess: () => useChessStore((s: ChessState) => s.chess),
  useBoard: () => (useChessStore as any)((s: ChessState) => s.board, shallow),
  useSelectedSquare: () => useChessStore((s: ChessState) => s.selectedSquare),
  useLegalMoves: () =>
    (useChessStore as any)((s: ChessState) => s.legalMoves, shallow),
  useSelection: () => {
    const selectedSquare = useChessStore((s: ChessState) => s.selectedSquare);
    const legalMoves = (useChessStore as any)(
      (s: ChessState) => s.legalMoves,
      shallow
    );
    return { selectedSquare, legalMoves };
  },
  useDrag: () => useChessStore((s: ChessState) => s.draggedSquare),
  useLastMove: () => useChessStore((s: ChessState) => s.lastMove),
  useIsCheck: () => useChessStore((s: ChessState) => s.isCheck),
  useIsCheckmate: () => useChessStore((s: ChessState) => s.isCheckmate),
  useIsStalemate: () => useChessStore((s: ChessState) => s.isStalemate),
  useIsDraw: () => useChessStore((s: ChessState) => s.isDraw),
  useTurn: () => useChessStore((s: ChessState) => s.turn),
  useKingSquare: () => useChessStore((s: ChessState) => s.kingSquare),
  useOrientation: () => useChessStore((s: ChessState) => s.orientation),
  usePromotion: () => useChessStore((s: ChessState) => s.promotionSquare),
  useArrows: () => (useChessStore as any)((s: ChessState) => s.arrows, shallow),
  useArrowColor: () => useChessStore((s: ChessState) => s.arrowColor),
  useAnimationState: () => useChessStore((s: ChessState) => s.animationState),
  useMoveAnimationDuration: () =>
    useChessStore((s: ChessState) => s.moveAnimationDuration),
  useArrowDisplayDuration: () =>
    useChessStore((s: ChessState) => s.arrowDisplayDuration),
  useMoveToken: () => useChessStore((s: ChessState) => s.moveToken),
  useAutoPromoteToQueen: () =>
    useChessStore((s: ChessState) => s.autoPromoteToQueen),
  useOverlayIntent: () =>
    (useChessStore as any)((s: ChessState) => s.overlayIntent, shallow),
  useControlledMode: () => useChessStore((s: ChessState) => s.isControlled),

  // ============================================================================
  // NEW SELECTORS: For position navigation
  // ============================================================================
  useAnimatingMove: () => useChessStore((s: ChessState) => s.animatingMove),
  usePositions: () =>
    (useChessStore as any)((s: ChessState) => s.positions, shallow),
  useCurrentPositionIndex: () =>
    useChessStore((s: ChessState) => s.currentPositionIndex),
  useCanUndo: () =>
    useChessStore((s: ChessState) => s.currentPositionIndex > 0),
  useCanRedo: () =>
    useChessStore(
      (s: ChessState) => s.currentPositionIndex < s.positions.length - 1
    ),
  useMoveHistory: () =>
    (useChessStore as any)((s: ChessState) => s.moveHistory, shallow),
};
