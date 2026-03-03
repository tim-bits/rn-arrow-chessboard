import { useCallback, useEffect, useRef } from 'react';
import type { Square } from '../../types/shared';
import { useChessStore, type ChessState } from '../../store/chessStore';
import { log } from '../../utils/log';

interface UseChessInteractionProps {
  autoPromoteToQueen: boolean;
  onMove?: (move: { from: string; to: string; promotion?: string }) => void;
}

export const useChessInteraction = ({
  autoPromoteToQueen,
  onMove,
}: UseChessInteractionProps) => {
  const requestMove = useChessStore((s: ChessState) => s.requestMove);
  const setAnimationState = useChessStore(
    (s: ChessState) => s.setAnimationState
  );
  const getChess = useChessStore((s: ChessState) => s.chess);

  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  const performMove = useCallback(
    (
      from: Square,
      to: Square,
      promotion?: string,
      onPromotion?: (from: Square, to: Square) => void
    ) => {
      const legalMoves = getChess.moves({ square: from, verbose: true }) || [];
      const targetMove = legalMoves.find((m: any) => m.to === to);

      if (targetMove && targetMove.flags.includes('p')) {
        if (autoPromoteToQueen) {
          promotion = 'q';
        } else if (!promotion) {
          onPromotion?.(from, to);
          return false;
        }
      }

      const token = useChessStore.getState().moveToken;
      log(
        `[Timing] requestMove begin ${from}->${to} t=${Date.now()} token=${token}`
      );
      const result = requestMove(from, to, promotion, {
        allowQueue: false,
        flushIfAnimating: true,
        clearQueue: true,
      });
      log(
        `[Timing] requestMove result ${from}->${to} result=${result} t=${Date.now()} token=${useChessStore.getState().moveToken}`
      );
      if (result === 'started') {
        setAnimationState('animating');
        onMoveRef.current?.({ from, to, promotion });
        return true;
      }
      if (result === 'queued') {
        return true;
      }
      return false;
    },
    [requestMove, autoPromoteToQueen, getChess, setAnimationState]
  );

  return {
    performMove,
  };
};
