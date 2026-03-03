import type { Square } from '../types/shared.js';

/**
 * Convert board coordinates (rank, file indices) to Square notation
 * @param rankIdx 0-7 (0 = rank 8, 7 = rank 1)
 * @param fileIdx 0-7 (0 = file a, 7 = file h)
 * @param orientation Board orientation ("white" or "black")
 * @returns Square notation (e.g., "e4")
 */
export function indicesToSquare(
  rankIdx: number,
  fileIdx: number,
  orientation: 'white' | 'black' = 'white'
): Square {
  // Normalize indices to 0-7 range
  const normalizedRank = Math.max(0, Math.min(7, Math.floor(rankIdx)));
  const normalizedFile = Math.max(0, Math.min(7, Math.floor(fileIdx)));

  let rank: number;
  let file: number;

  if (orientation === 'white') {
    // White orientation: rank 0 = rank 8, file 0 = file a
    rank = 8 - normalizedRank;
    file = normalizedFile;
  } else {
    // Black orientation: rank 0 = rank 1, file 0 = file h (flipped)
    rank = normalizedRank + 1;
    file = 7 - normalizedFile;
  }

  const fileChar = String.fromCharCode(97 + file); // 'a' = 97
  return `${fileChar}${rank}` as Square;
}

/**
 * Convert Square notation to board coordinates
 * @param square Square notation (e.g., "e4")
 * @param orientation Board orientation ("white" or "black")
 * @returns [rankIdx, fileIdx] where rankIdx 0-7, fileIdx 0-7
 */
export function squareToIndices(
  square: Square,
  orientation: 'white' | 'black' = 'white'
): [number, number] {
  const fileChar = square.charAt(0);
  const rankStr = square.charAt(1);
  const file = fileChar.charCodeAt(0) - 97; // 'a' = 97
  const rank = parseInt(rankStr, 10);

  let rankIdx: number;
  let fileIdx: number;

  if (orientation === 'white') {
    rankIdx = 8 - rank;
    fileIdx = file;
  } else {
    rankIdx = rank - 1;
    fileIdx = 7 - file;
  }

  return [rankIdx, fileIdx];
}

/**
 * Get the square at a given pixel position on the board
 * @param x X coordinate in pixels
 * @param y Y coordinate in pixels
 * @param boardWidth Board width in pixels
 * @param boardHeight Board height in pixels
 * @param orientation Board orientation
 * @returns Square notation or null if outside board
 */
export function pixelToSquare(
  x: number,
  y: number,
  boardWidth: number,
  boardHeight: number,
  orientation: 'white' | 'black' = 'white'
): Square | null {
  const squareWidth = boardWidth / 8;
  const squareHeight = boardHeight / 8;

  const fileIdx = Math.floor(x / squareWidth);
  const rankIdx = Math.floor(y / squareHeight);

  // Check bounds
  if (fileIdx < 0 || fileIdx >= 8 || rankIdx < 0 || rankIdx >= 8) {
    return null;
  }

  return indicesToSquare(rankIdx, fileIdx, orientation);
}

/**
 * Convert Square notation to pixel coordinates on the board
 * Returns the center of the square
 * @param square Square notation (e.g., "e4")
 * @param boardWidth Board width in pixels
 * @param boardHeight Board height in pixels
 * @param orientation Board orientation
 * @returns [x, y] pixel coordinates at center of square
 */
export function squareToPixel(
  square: Square,
  boardWidth: number,
  boardHeight: number,
  orientation: 'white' | 'black' = 'white'
): [number, number] {
  const [rankIdx, fileIdx] = squareToIndices(square, orientation);

  const squareWidth = boardWidth / 8;
  const squareHeight = boardHeight / 8;

  // Return center of square
  const x = fileIdx * squareWidth + squareWidth / 2;
  const y = rankIdx * squareHeight + squareHeight / 2;

  return [x, y];
}
