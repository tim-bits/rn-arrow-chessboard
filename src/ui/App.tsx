import {
  Text,
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  Pressable,
} from 'react-native';
import React, { useRef } from 'react';
import Chessboard from '../../src/ui/Chessboard';
import { ChessProvider } from '../../src/ui/ChessProvider';
import { useChessStore } from '../../src/store/chessStore';
import { useChessboardAnimation } from '../../src/hooks/useChessboardAnimation';
import { log } from '../utils/log';

const MOVE_ANIMATION_DURATION = 1500;

function ChessDemo() {
  const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const [demoKey, setDemoKey] = React.useState(0);

  // Orchestration: reads moveAnimationDuration from Zustand store (set by component)
  const { move, arrows } = useChessboardAnimation();

  const didRunRef = useRef(false);

  React.useEffect(() => {
    (async () => {
      if (didRunRef.current) {
        log('[Demo] Has already been run...');
        return;
      }
      didRunRef.current = true;

      log('[Demo] Starting sequence...');

      // Move 1: White plays e2-e4
      log('[Demo] Setting arrows for e2-e4');
      await arrows([
        ['e2', 'e4'],
        ['d2', 'd4'],
      ]); // e4 is best (thicker)
      log('[Demo] Executing move e2-e4');
      await move('e2', 'e4'); // Arrows render during 2000ms animation, then clear
      log('[Demo] Move e2-e4 complete');

      // Move 2: Black plays e7-e5
      log('[Demo] Setting arrows for e7-e5');
      await arrows([
        ['e7', 'e5'],
        ['c7', 'c6'],
        ['g8', 'f6'],
      ]); // e5 is best
      log('[Demo] Executing move e7-e5');
      await move('e7', 'e5');
      log('[Demo] Move e7-e5 complete');

      // Move 3: White plays Nf3
      log('[Demo] Setting arrows for g1-f3');
      await arrows([
        ['g1', 'f3'],
        ['b1', 'c3'],
      ]);
      log('[Demo] Executing move g1-f3');
      await move('g1', 'f3');
      log('[Demo] Move g1-f3 complete');

      // Move 4: Black plays Nc6
      log('[Demo] Setting arrows for b8-c6');
      await arrows([
        ['b8', 'c6'],
        ['g8', 'f6'],
      ]);
      log('[Demo] Executing move b8-c6');
      await move('b8', 'c6');
      log('[Demo] Move b8-c6 complete');

      // Move 5: White plays Bc4
      log('[Demo] Setting arrows for f1-c4');
      await arrows([
        ['f1', 'c4'],
        ['b1', 'c3'],
        ['c1', 'f4'],
      ]);
      log('[Demo] Executing move f1-c4');
      await move('f1', 'c4'); // Complete the sequence
      log('[Demo] Move f1-c4 complete');
      await arrows([]);

      log('Demo sequence complete!');
    })();
  }, [move, arrows, demoKey]);

  const handleRerunDemo = () => {
    useChessStore.setState({
      fen: initialFen,
      board: new (require('chess.js').Chess)(initialFen).board(),
      arrows: [],
      animationState: 'idle',
      lastMove: null,
      moveHistory: [],
    });
    setDemoKey((k) => k + 1);
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.container}>
        <Text style={styles.title}>
          Interactive Chessboard ------------------------------------------
          Auto-Play Demo!!!
        </Text>
        <Chessboard
          {...({
            moveAnimationDuration: MOVE_ANIMATION_DURATION,
            key: demoKey,
            position: initialFen,
            boardSize:
              Dimensions.get('window').width > Dimensions.get('window').height
                ? Dimensions.get('window').width * 0.5
                : Dimensions.get('window').height * 0.5,
            showCoordinates: true,
            autoPromoteToQueen: false,
            onMove: ({
              from,
              to,
              promotion,
            }: {
              from: string;
              to: string;
              promotion?: string;
            }) => {
              log('[App] Move made:', { from, to, promotion });
            },
          } as any)}
        />
        <Pressable
          style={({ pressed }: { pressed: boolean }) => [
            styles.button,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={handleRerunDemo}
        >
          <Text style={styles.buttonText}>Rerun Demo</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export default function App() {
  return (
    <ChessProvider moveAnimationDuration={MOVE_ANIMATION_DURATION}>
      <ChessDemo />
    </ChessProvider>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 40,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    marginBottom: 12,
    fontWeight: '600',
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
