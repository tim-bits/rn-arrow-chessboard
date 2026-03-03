import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
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
  selectedSquare: string | null;
  legalMovesSet: Set<string>;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  kingSquare: string | null;
  draggedSquare: string | null;
  animatedFrom: string | null;
  animatedTo: string | null;
  disablePop: boolean;
  style?: ViewStyle;
};

export const BoardView: React.FC<BoardViewProps> = ({
  rows,
  selectedSquare,
  legalMovesSet,
  isCheck,
  isCheckmate,
  isStalemate,
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
        <BoardRow
          key={`r-${rIdx}`}
          rank={rank}
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
  selectedSquare: string | null;
  legalMovesSet: Set<string>;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  kingSquare: string | null;
  draggedSquare: string | null;
  animatedFrom: string | null;
  animatedTo: string | null;
  disablePop: boolean;
};

const BoardRow: React.FC<BoardRowProps> = React.memo(
  ({
    rank,
    selectedSquare,
    legalMovesSet,
    isCheck,
    isCheckmate,
    isStalemate,
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
            key={sq.key}
            squareNotation={sq.squareNotation}
            pieceKey={sq.pieceKey}
            pieceImage={sq.pieceImage}
            isLight={sq.isLight}
            isSelected={isSelected}
            isLegal={isLegal}
            isKingInCheck={isKingInCheck}
            kingSquare={kingSquare}
            isGameOver={isCheckmate || isStalemate}
            isDragged={isDraggedSquare}
            disablePop={disablePop || isDraggedSquare}
          />
        );
      })}
    </View>
  ),
  (prev, next) =>
    prev.rank === next.rank &&
    prev.selectedSquare === next.selectedSquare &&
    prev.legalMovesSet === next.legalMovesSet &&
    prev.isCheck === next.isCheck &&
    prev.isCheckmate === next.isCheckmate &&
    prev.isStalemate === next.isStalemate &&
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
