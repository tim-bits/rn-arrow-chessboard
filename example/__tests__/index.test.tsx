import { act } from '@testing-library/react-native';
import { useChessStore } from '../../src/store/chessStore';

// Use the store's reset helper to clear history, positions, queues, and selection.
const reset = () => useChessStore.getState().reset();

describe('Chess store basics', () => {
  beforeEach(() => {
    reset();
  });

  test('setPosition sets fen', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    act(() => useChessStore.getState().setPosition(fen));
    expect(useChessStore.getState().fen).toBe(fen);
  });

  test('makeMove accepts legal and rejects illegal', () => {
    const ok = useChessStore.getState().makeMove('e2', 'e4');
    useChessStore.getState().completeAnimation();
    expect(ok).toBe(true);
    const bad = useChessStore.getState().makeMove('e2', 'e5');
    expect(bad).toBe(false);
  });

  test('undo/redo adjusts position index', () => {
    const { makeMove, undo, redo } = useChessStore.getState();
    act(() => {
      makeMove('e2', 'e4');
      useChessStore.getState().completeAnimation();
    });
    const afterMove = useChessStore.getState().currentPositionIndex;
    act(() => undo());
    const afterUndo = useChessStore.getState().currentPositionIndex;
    act(() => redo());
    const afterRedo = useChessStore.getState().currentPositionIndex;
    expect(afterMove).toBe(1);
    expect(afterUndo).toBe(0);
    expect(afterRedo).toBe(1);
  });

  test('legal moves contain e4 from start', () => {
    act(() => useChessStore.getState().selectSquare('e2'));
    const legal = useChessStore.getState().legalMoves;
    expect(legal.some((m: string) => m === 'e4')).toBe(true);
  });

  test('canUndo/canRedo selectors', () => {
    act(() => useChessStore.getState().makeMove('e2', 'e4'));
    useChessStore.getState().completeAnimation();
    expect(useChessStore.getState().currentPositionIndex).toBe(1);
    expect(
      useChessStore.getState().currentPositionIndex <
        useChessStore.getState().positions.length - 1
    ).toBe(false);
    act(() => useChessStore.getState().undo());
    expect(useChessStore.getState().currentPositionIndex).toBe(0);
    act(() => useChessStore.getState().redo());
    expect(useChessStore.getState().currentPositionIndex).toBe(1);
  });

  test('checkmate detection (Fool’s mate)', () => {
    act(() =>
      useChessStore
        .getState()
        .setPosition(
          'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2'
        )
    );
    act(() => useChessStore.getState().makeMove('d8', 'h4'));
    useChessStore.getState().completeAnimation();
    expect(useChessStore.getState().isCheckmate).toBe(true);
  });

  test('history and lastMove track SAN/color', () => {
    act(() => useChessStore.getState().makeMove('e2', 'e4'));
    useChessStore.getState().completeAnimation();
    const last = useChessStore.getState().lastMove;
    expect(last?.san).toBeDefined();
    expect(last?.color).toBe('w');
  });

  test('goToPosition updates board and lastMove', () => {
    act(() => {
      useChessStore.getState().makeMove('e2', 'e4');
      useChessStore.getState().completeAnimation();
      useChessStore.getState().makeMove('e7', 'e5');
      useChessStore.getState().completeAnimation();
    });
    const fenAfterTwo = useChessStore.getState().fen;
    act(() => useChessStore.getState().goToPosition(0));
    expect(useChessStore.getState().fen).not.toBe(fenAfterTwo);
    act(() => useChessStore.getState().goToPosition(2));
    expect(useChessStore.getState().fen).toBe(fenAfterTwo);
    expect(useChessStore.getState().lastMove?.from).toBe('e7');
  });

  test('promotion applies when provided', () => {
    // White pawn on a7 ready to promote
    act(() =>
      useChessStore.getState().setPosition('8/P7/8/8/8/8/8/K6k w - - 0 1')
    );
    act(() => useChessStore.getState().makeMove('a7', 'a8', 'q'));
    useChessStore.getState().completeAnimation();
    expect(useChessStore.getState().fen.toLowerCase()).toContain('q');
  });

  test('requestMove queues when animating', () => {
    // Simulate animatingMove to force queue path
    const state = useChessStore.getState();
    useChessStore.setState({
      animatingMove: {
        fromPosition: state.chess,
        toPosition: state.chess,
        moveData: {
          from: 'e2',
          to: 'e4',
          san: 'e4',
          color: 'w',
          piece: 'p',
        },
      } as any,
      // Provide pendingBoardUpdate so completeAnimation() will drain and unlock queue
      pendingBoardUpdate: {
        chess: state.chess,
        fen: state.chess.fen() as any,
        board: state.chess.board(),
        positions: state.positions,
        currentPositionIndex: state.currentPositionIndex,
        lastMove: null as any,
        moveHistory: state.moveHistory,
        isCheck: state.isCheck,
        isCheckmate: state.isCheckmate,
        isStalemate: state.isStalemate,
        isDraw: state.isDraw,
        turn: state.turn,
        kingSquare: state.kingSquare,
      },
    });

    const result = useChessStore
      .getState()
      .requestMove('d2', 'd4', undefined, { allowQueue: true });
    expect(result).toBe('queued');
    expect(useChessStore.getState().queuedMoves.length).toBe(1);
    // Complete animation then process queue
    act(() => useChessStore.getState().completeAnimation());
    act(() => useChessStore.getState().processQueue());
    expect(useChessStore.getState().queuedMoves.length).toBe(0);
  });

  test('flushIfAnimating bypasses queue', () => {
    const state = useChessStore.getState();
    useChessStore.setState({
      animatingMove: {
        fromPosition: state.chess,
        toPosition: state.chess,
        moveData: {
          from: 'e2',
          to: 'e4',
          san: 'e4',
          color: 'w',
          piece: 'p',
        },
      } as any,
      queuedMoves: [{ from: 'a2', to: 'a3' }], // ensure clearQueue path exercised
      pendingBoardUpdate: {
        chess: state.chess,
        fen: state.chess.fen() as any,
        board: state.chess.board(),
        positions: state.positions,
        currentPositionIndex: state.currentPositionIndex,
        lastMove: null as any,
        moveHistory: state.moveHistory,
        isCheck: state.isCheck,
        isCheckmate: state.isCheckmate,
        isStalemate: state.isStalemate,
        isDraw: state.isDraw,
        turn: state.turn,
        kingSquare: state.kingSquare,
      },
    });
    const result = useChessStore.getState().requestMove('d2', 'd4', undefined, {
      allowQueue: true,
      flushIfAnimating: true,
      clearQueue: true,
    });
    expect(result).toBe('started');
  });

  test('arrows set and clear', () => {
    act(() => useChessStore.getState().setArrows([['e2', 'e4']]));
    expect(useChessStore.getState().arrows.length).toBe(1);
    act(() => useChessStore.getState().clearArrows());
    expect(useChessStore.getState().arrows.length).toBe(0);
  });
});
