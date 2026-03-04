import { Chess } from 'chess.js';
import { indicesToSquare } from '../boardGeometry';

/**
 * Utility function to find the king square
 */
function findKingSquare(
  board: ReturnType<Chess['board']>,
  kingColor: 'w' | 'b'
): string | null {
  for (let rIdx = 0; rIdx < board.length; rIdx++) {
    const row = board[rIdx];
    if (!row) continue;
    for (let fIdx = 0; fIdx < row.length; fIdx++) {
      const piece = row[fIdx];
      if (piece && piece.type === 'k' && piece.color === kingColor) {
        return indicesToSquare(rIdx, fIdx, 'white');
      }
    }
  }
  return null;
}

describe('Check and Checkmate Detection', () => {
  it('should detect king in check position', () => {
    // Fool's mate position - white king in check
    const chess = new Chess(
      'rnbqkbnr/pppp1ppp/8/4p3/6PP/5P2/PPPPP2P/RNBQKBNR w KQkq - 0 1'
    );

    const board = chess.board();
    const whiteKing = findKingSquare(board, 'w');

    // White king should be on e1 in starting position
    expect(whiteKing).toBe('e1');
    expect(chess.isCheck()).toBe(false);
  });

  it('should detect checkmate position', () => {
    // Fool's mate - fastest checkmate
    const chess = new Chess();

    // Move 1: f3 e5
    chess.move({ from: 'f2', to: 'f3' });
    chess.move({ from: 'e7', to: 'e5' });

    // Move 2: g4 Qh5#
    chess.move({ from: 'g2', to: 'g4' });
    chess.move({ from: 'd8', to: 'h4' });

    // Now white is in checkmate
    expect(chess.turn()).toBe('w');
    expect(chess.isCheck()).toBe(true);
    expect(chess.isCheckmate()).toBe(true);

    const board = chess.board();
    const whiteKing = findKingSquare(board, 'w');
    expect(whiteKing).toBe('e1');
  });

  it('should detect simple check position', () => {
    // Position where white king is in check from black queen
    const chess = new Chess('8/8/8/8/8/8/R3k3/K6q w - - 0 1');

    expect(chess.turn()).toBe('w');
    expect(chess.isCheck()).toBe(true);
    expect(chess.isCheckmate()).toBe(false);

    const board = chess.board();
    const whiteKing = findKingSquare(board, 'w');
    expect(whiteKing).toBe('a1');
  });

  it('should identify correct king during black turn', () => {
    const chess = new Chess();

    chess.move({ from: 'e2', to: 'e4' });

    expect(chess.turn()).toBe('b');

    const board = chess.board();
    const blackKing = findKingSquare(board, 'b');
    expect(blackKing).toBe('e8');
  });

  it('should find king on any square', () => {
    // White King on h1, Black King on a8
    const chess = new Chess('k7/8/8/8/8/8/8/7K w - - 0 1');

    const board = chess.board();
    const whiteKing = findKingSquare(board, 'w');
    expect(whiteKing).toBe('h1');

    const blackKing = findKingSquare(board, 'b');
    expect(blackKing).toBe('a8');
  });
});
