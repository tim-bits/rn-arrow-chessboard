import React from 'react';
import { useChessStore } from '../store/chessStore';
import { log } from '../utils/log';

/**
 * ChessProvider: Initializes critical store configuration BEFORE any child components run.
 * 
 * This is required when using hooks like `useChessboardAnimation` in a parent component,
 * as it ensures the store is ready before those hooks execute.
 */
export function ChessProvider({
  moveAnimationDuration,
  arrowDisplayDuration,
  children,
}: {
  moveAnimationDuration?: number;
  arrowDisplayDuration?: number;
  children: React.ReactNode;
}) {
  const [isReady, setIsReady] = React.useState(false);

  // Initialize store configuration ONCE on mount, before children render
  React.useLayoutEffect(() => {
    log('[ChessProvider] useLayoutEffect: Setting duration to store:', moveAnimationDuration);
    if (moveAnimationDuration !== undefined) {
      useChessStore.getState().setMoveAnimationDuration(moveAnimationDuration);
    }
    if (arrowDisplayDuration !== undefined) {
      useChessStore.getState().setArrowDisplayDuration(arrowDisplayDuration);
    }
    setIsReady(true);
  }, [moveAnimationDuration, arrowDisplayDuration]);

  // Gate rendering until the store has been updated
  if (!isReady) {
    return null;
  }

  return <>{children}</>;
};

export default ChessProvider; 