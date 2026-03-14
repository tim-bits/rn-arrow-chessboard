import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { BoardSquare } from './BoardSquare';

type RowSquare = {
  key: string;
  squareNotation: string;
  isLight: boolean;
  pieceKey: string | null;
  pieceImage: any;
};

type BoardViewProps = {
  rows: Array<Array<RowSquare>>;
  squareSize: number;
  selectedSquare: string | null;
  legalMovesSet: Set<string>;
  isCheck: boolean;
  isCheckmate: boolean;
  kingSquare: string | null;
  draggedSquare: string | null;
  animatedFrom: string | null;
  animatedTo: string | null;
  disablePop: boolean;
  style?: ViewStyle;
};

export const BoardView: React.FC<BoardViewProps> = ({
  rows,
  squareSize,
  selectedSquare,
  legalMovesSet,
  isCheck,
  isCheckmate,
  kingSquare,
  draggedSquare,
  animatedFrom,
  animatedTo,
  disablePop,
  style,
}) => {
  // disablePop may be a Reanimated shared value; normalize to boolean
  const disablePopBool =
    typeof (disablePop as any)?.value === 'boolean'
      ? (disablePop as any).value
      : Boolean(disablePop);

  return (
    <View style={[styles.board, style]}>
      {rows.map((rank, rIdx) => (
        // key is handled by React but not part of BoardRowProps
        <BoardRow
          // @ts-ignore key prop not part of BoardRowProps
          key={`r-${rIdx}`}
          rank={rank}
          squareSize={squareSize}
          selectedSquare={selectedSquare}
          legalMovesSet={legalMovesSet}
          isCheck={isCheck}
          isCheckmate={isCheckmate}
          kingSquare={kingSquare}
          draggedSquare={draggedSquare}
          animatedFrom={animatedFrom}
          animatedTo={animatedTo}
          disablePop={disablePopBool}
        />
      ))}
    </View>
  );
};

type BoardRowProps = {
  rank: Array<RowSquare>;
  squareSize: number;
  selectedSquare: string | null;
  legalMovesSet: Set<string>;
  isCheck: boolean;
  isCheckmate: boolean;
  kingSquare: string | null;
  draggedSquare: string | null;
  animatedFrom: string | null;
  animatedTo: string | null;
  disablePop: boolean;
};

const BoardRow: React.FC<BoardRowProps> = React.memo(
  ({
    rank,
    squareSize,
    selectedSquare,
    legalMovesSet,
    isCheck,
    isCheckmate,
    kingSquare,
    draggedSquare,
    animatedFrom,
    animatedTo,
    disablePop,
  }) => (
    <View style={styles.row}>
      {rank.map((sq) => {
        const isSelected = selectedSquare === sq.squareNotation;
        const isLegal = legalMovesSet.has(sq.squareNotation);
        const isKingInCheck =
          (isCheck || isCheckmate) && sq.squareNotation === kingSquare;

        const isBeingDragged = draggedSquare === sq.squareNotation;
        const isCurrentAnimationSquare =
          (!!animatedFrom && animatedFrom === sq.squareNotation) ||
          (!!animatedTo && animatedTo === sq.squareNotation);

        const isDraggedSquare = isBeingDragged || isCurrentAnimationSquare;

        return (
          <BoardSquare
            // @ts-ignore key prop not part of BoardSquareProps
            key={sq.key}
            squareNotation={sq.squareNotation}
            pieceKey={sq.pieceKey}
            pieceImage={sq.pieceImage}
            isLight={sq.isLight}
            squareSize={squareSize}
            isSelected={isSelected}
            isLegal={isLegal}
            isKingInCheck={isKingInCheck}
            kingSquare={kingSquare}
            isGameOver={isCheckmate}
            isDragged={isDraggedSquare}
            disablePop={disablePop}
          />
        );
      })}
    </View>
  ),
  (prev, next) =>
    prev.rank === next.rank &&
    prev.squareSize === next.squareSize &&
    prev.selectedSquare === next.selectedSquare &&
    prev.legalMovesSet === next.legalMovesSet &&
    prev.isCheck === next.isCheck &&
    prev.isCheckmate === next.isCheckmate &&
    prev.kingSquare === next.kingSquare &&
    prev.draggedSquare === next.draggedSquare &&
    prev.animatedFrom === next.animatedFrom &&
    prev.animatedTo === next.animatedTo &&
    prev.disablePop === next.disablePop
);

const styles = StyleSheet.create({
  board: { width: 320, height: 320 },
  row: { flexDirection: 'row', flex: 1 },
});

export default BoardView;
