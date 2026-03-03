import React from 'react';
import { Modal, View, StyleSheet, Image } from 'react-native';

type Props = {
  visible: boolean;
  color: 'w' | 'b';
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel: () => void;
};

const PromotionDialog: React.FC<Props> = ({
  visible,
  color,
  onSelect,
  onCancel,
}) => {
  const pieces: Array<'q' | 'r' | 'b' | 'n'> = ['q', 'r', 'b', 'n'];

  const imageFor = (_color: 'w' | 'b', piece: string) => {
    const key = `${color}${piece.toUpperCase()}`;
    switch (key) {
      case 'wQ':
        return require('../assets/chesspieces/wQ.png');
      case 'wR':
        return require('../assets/chesspieces/wR.png');
      case 'wB':
        return require('../assets/chesspieces/wB.png');
      case 'wN':
        return require('../assets/chesspieces/wN.png');
      case 'bQ':
        return require('../assets/chesspieces/bQ.png');
      case 'bR':
        return require('../assets/chesspieces/bR.png');
      case 'bB':
        return require('../assets/chesspieces/bB.png');
      case 'bN':
        return require('../assets/chesspieces/bN.png');
      default:
        return require('../assets/chesspieces/wQ.png');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={styles.backdrop}
        onStartShouldSetResponder={() => true}
        onResponderRelease={onCancel}
      >
        <View style={styles.container}>
          <View style={styles.row}>
            {pieces.map((p) => (
              <View
                key={p}
                style={[
                  styles.pieceButton,
                  color === 'w'
                    ? styles.pieceButtonLight
                    : styles.pieceButtonDark,
                ]}
                onStartShouldSetResponder={() => true}
                onResponderRelease={() => onSelect(p)}
              >
                <Image
                  source={imageFor(color, p)}
                  style={styles.pieceImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#f0d9b5',
    padding: 20,
    borderRadius: 12,
    minWidth: 300,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 0,
  },
  pieceButtonLight: {
    backgroundColor: '#f0d9b5',
  },
  pieceButtonDark: {
    backgroundColor: '#b58863',
  },
  pieceButton: {
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#666',
    borderRadius: 8,
  },
  pieceImage: {
    width: 80,
    height: 80,
  },
});

export default PromotionDialog;
