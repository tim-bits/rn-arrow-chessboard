import React from 'react';
import {
  useChessStore,
  chessSelectors,
  type ChessState,
} from '../store/chessStore';
import type { Square, ArrowPair } from '../types/shared';
import { log } from '../utils/log';

/**
 * Orchestration hook for animation lifecycle management
 * Provides async move() and arrows() wrappers that handle timing and token-based cancellation
 * Reads moveAnimationDuration from Zustand store
 */
export const useChessboardAnimation = () => {
  const moveAnimationDuration = chessSelectors.useMoveAnimationDuration();
  const arrowDisplayDuration = chessSelectors.useArrowDisplayDuration();
  log(
    '[useChessboardAnimation] Hook called, duration from store:',
    moveAnimationDuration
  );
  const animationState = chessSelectors.useAnimationState();
  const setAnimationState = useChessStore(
    (s: ChessState) => s.setAnimationState
  );
  const requestMove = useChessStore((s: ChessState) => s.requestMove);
  const setArrows = useChessStore((s: ChessState) => s.setArrows);

  // Async move wrapper that includes animation timing and token-based cancellation
  const move = React.useCallback(
    async (from: Square, to: Square, promotion?: string): Promise<boolean> => {
      const token = useChessStore.getState().bumpMoveToken();
      log(
        `[useChessboardAnimation] Moving: ${from} -> ${to}, token=${token}, waiting ${moveAnimationDuration}ms`
      );

      return new Promise<boolean>((resolve, reject) => {
        // Check if move was cancelled before we even start
        if (token !== useChessStore.getState().moveToken) {
          log(
            `[useChessboardAnimation] Move cancelled before start: ${from}->${to}`
          );
          reject(new Error('move cancelled'));
          return;
        }

        // Clear arrows when move starts
        setArrows([]);

        setAnimationState('animating');
        const result = requestMove(from, to, promotion, {
          startOverlayIntent: true,
        });
        const success = result !== 'rejected';
        log(`[useChessboardAnimation] requestMove returned: ${result}`);
        if (!success) {
          resolve(false);
          return;
        }

        // Wait for animation to complete, checking token validity during wait
        // no cleanup token here; just wait
        setTimeout(() => {
          // Check if token is still valid at completion
          if (token !== useChessStore.getState().moveToken) {
            log(
              `[useChessboardAnimation] Move cancelled during animation: ${from}->${to}`
            );
            reject(new Error('move cancelled'));
            return;
          }

          log(`[useChessboardAnimation] Animation complete for ${from}->${to}`);
          resolve(success);
        }, moveAnimationDuration);

        // Return cleanup if needed (though we don't have a way to cancel the timeout here without a ref)
      });
    },
    [requestMove, moveAnimationDuration, setAnimationState, setArrows]
  );

  // Async arrows wrapper that sets arrows and waits for render + display time
  const arrows = React.useCallback(
    async (pairs: ArrowPair[]): Promise<void> => {
      setArrows(pairs);

      // Wait for React Native to fully render the arrows
      // Multiple frames needed for SVG path rendering to complete
      await new Promise((resolve) => {
        // requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve(undefined));
        });
        // });
      });

      // After arrows are rendered, wait for a display duration
      // so they're visible before the next move starts
      await new Promise((resolve) => setTimeout(resolve, arrowDisplayDuration));
    },
    [setArrows, arrowDisplayDuration]
  );

  return {
    animationState,
    isAnimating: animationState === 'animating',
    move, // Async move with built-in animation duration
    arrows, // Async arrows with render cycle wait
  };
};
