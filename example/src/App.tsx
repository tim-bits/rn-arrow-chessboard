import {
  Text,
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  useWindowDimensions,
  Switch,
  TouchableOpacity
} from 'react-native';
import React, { useRef, useState } from 'react';
import Chessboard from '../../src/ui/Chessboard';
import { ChessProvider } from '../../src/ui/ChessProvider';
import { useChessStore, chessSelectors, type ChessState } from '../../src/store/chessStore';
import { useChessboardAnimation } from '../../src/hooks/useChessboardAnimation';
import { createLichessCloudAdapter } from '../../src/adapters';
import { log } from '../../src/utils/log';
import type { Square, ArrowPair } from '../../src/types/shared';

const DEFAULT_MOVE_ANIMATION_DURATION = 1500;
const DEFAULT_ARROW_DISPLAY_DURATION = 500;
const LICHESS_API_LABEL = 'lichess.org/api/cloud-eval';
type LichessStatus = 'idle' | 'ok' | 'rate_limited' | 'error';





function ChessDemoEffects({
  mode,
  autoPlay,
  initialFen,
  demoKey,
  stopAutoMovesRef,
  isDemoRunning,
  setIsDemoRunning,
  onBumpDemoKey,
  onLichessStatusChange,
}: {
  mode: 'demo' | 'manual' | 'lichess';
  autoPlay: boolean;
  initialFen: string;
  demoKey: number;
  stopAutoMovesRef: React.MutableRefObject<boolean>;
  isDemoRunning: boolean;
  setIsDemoRunning: (running: boolean) => void;
  onBumpDemoKey: () => void;
  onLichessStatusChange?: (status: LichessStatus) => void;
}) {
  const { move, arrows } = useChessboardAnimation();
  const fen = chessSelectors.useFen();
  const lichessAdapterRef = useRef(createLichessCloudAdapter({ multiPv: 3 }));
  const moveAnimationDuration = chessSelectors.useMoveAnimationDuration();
  const demoHasRun = useChessStore((s: ChessState) => s.demoHasRun);
  const setDemoHasRun = useChessStore((s: ChessState) => s.setDemoHasRun);

  React.useEffect(() => {
    stopAutoMovesRef.current = mode !== 'demo';
    useChessStore.getState().setPosition(initialFen);
    useChessStore.getState().clearArrows();
    onBumpDemoKey();
  }, [mode, initialFen, onBumpDemoKey, stopAutoMovesRef]);

  React.useEffect(() => {
    if (mode !== 'lichess') return;
    let cancelled = false;
    let cooldownUntil = 0;
    let inFlight = false;

    const poll = async () => {
      if (cancelled) return;
      if (Date.now() < cooldownUntil) return;
      if (inFlight) return;
      try {
        const result = await lichessAdapterRef.current.getSuggestions(fen);
        onLichessStatusChange?.('ok');
        const moves = result.bestMove ? [result.bestMove] : [];
        const pairs = result.arrows || [];
        useChessStore.getState().setArrows(pairs as any);

        if (autoPlay && moves.length > 0) {
          inFlight = true;
          try {
            await arrows(pairs as any);
            await new Promise((resolve) =>
              setTimeout(resolve, moveAnimationDuration)
            );
            useChessStore.getState().makeMove(
              moves[0]!.from as any,
              moves[0]!.to as any,
              moves[0]!.promotion as any
            );
          } finally {
            inFlight = false;
          }
        }
      } catch (err: any) {
        const message = String(err?.message || '');
        if (message.includes('429')) {
          onLichessStatusChange?.('rate_limited');
        } else if (
          message.includes('timeout') ||
          message.includes('Network request failed') ||
          message.includes('Failed to fetch')
        ) {
          onLichessStatusChange?.('error');
        } else {
          onLichessStatusChange?.('error');
        }
        // ignore network errors in demo polling
      }
    };

    const id = setInterval(poll, 3000);
    poll();

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [
    mode,
    fen,
    autoPlay,
    arrows,
    move,
    moveAnimationDuration,
    onLichessStatusChange,
  ]);

  React.useEffect(() => {
    (async () => {
      if (mode !== 'demo') {
        return;
      }
      if (stopAutoMovesRef.current) {
        log('[Demo] Skipped - manual flow');
        return;
      }

      if (demoHasRun) {
        log('[Demo] Has already been run...');
        return;
      }
      setDemoHasRun(true);

      try {
        log('[Demo] Starting promotion sequence...');
        setIsDemoRunning(true);
        const script = [
          {
            arrows: [
              ['g7', 'f6'],
              ['g7', 'g6'],
              ['g7', 'f8'],
            ],
            move: ['g7', 'f6'],
          },
          {
            arrows: [
              ['d5', 'c6'],
              ['d5', 'd6'],
              ['a1', 'a2'],
            ],
            move: ['d5', 'c6'],
          },
          {
            arrows: [
              ['f6', 'g5'],
              ['f6', 'g6'],
            ],
            move: ['f6', 'g5'],
          },
          {
            arrows: [
              ['c6', 'b7'],
              ['a1', 'a2'],
              ['e1', 'g1'],
            ],
            move: ['c6', 'b7'],
          },
          {
            arrows: [
              ['g5', 'f4'],
              ['b7', 'c6'],
              ['b5', 'b4'],
            ],
            move: ['g5', 'f4'],
          },
          {
            arrows: [
              ['b7', 'a8'],
              ['b7', 'b8'],
              ['e1', 'd1'],
            ],
            move: ['b7', 'a8', 'q'],
          },
          {
            arrows: [
              ['f4', 'e3'],
              ['f4', 'g4'],
              ['f4', 'e5'],
            ],
            move: ['f4', 'e3'],
          },
          {
            arrows: [
              ['e1', 'g1'],
              ['a1', 'a4'],
              ['a1', 'b1'],
            ],
            move: ['a1', 'a4'],
          },
          {
            arrows: [
              ['b4', 'b3'],
              ['a7', 'a5'],
              ['a7', 'a6'],
            ],
            move: ['b4', 'b3'],
          },
          {
            arrows: [
              ['a8', 'f3'],
              ['h1', 'h3'],
            ],
            move: ['a8', 'f3'],
          },
        ];

        for (const step of script) {
          if (stopAutoMovesRef.current) break;
          log(`[Demo] Setting arrows for ${step.move[1]}`);
          await arrows(step.arrows as ArrowPair[]);
          log(`[Demo] Executing move ${step.move[1]}`);
          await move(step.move[0] as Square, step.move[1] as Square, step.move[2] as string | undefined);
          log(`[Demo] Move ${step.move[1]} complete`);
        }

        await arrows([]);
        log('Demo sequence complete!');
      } catch (error: any) {
        log('[Demo] Sequence aborted:', error.message);
        // Demo was cancelled via token invalidation (user touched board)
        // Board is now in the state where touch occurred, ready for manual play
        await arrows([]);
      } finally {
        setIsDemoRunning(false);
      }
    })();
  }, [
    move,
    arrows,
    demoKey,
    mode,
    stopAutoMovesRef,
    isDemoRunning,
    demoHasRun,
    setDemoHasRun,
  ]);

  return null;
}

export default function App() {
  const [moveAnimationDuration, setMoveAnimationDuration] = useState(
    DEFAULT_MOVE_ANIMATION_DURATION
  );
  const [inputValue, setInputValue] = useState(
    String(DEFAULT_MOVE_ANIMATION_DURATION)
  );
  const [arrowDisplayDuration, setArrowDisplayDuration] = useState(
    DEFAULT_ARROW_DISPLAY_DURATION
  );
  const [arrowDurationInput, setArrowDurationInput] = useState(
    String(DEFAULT_ARROW_DISPLAY_DURATION)
  );
  const [arrowColor, setArrowColor] = useState('#FFD700');
  const [arrowColorInput, setArrowColorInput] = useState('#FFD700');
  const [lockScroll, setLockScroll] = useState(false);
  const [mode, setMode] = useState<'demo' | 'manual' | 'lichess'>('demo');
  const [autoPlay, setAutoPlay] = useState(false);
  const [lichessStatus, setLichessStatus] = useState<LichessStatus>('idle');
  const { width } = useWindowDimensions();

  const stopAutoMovesRef = useRef<boolean>(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  const isSmallScreen = width < 768;
  const isWeb = Platform.OS === 'web';
  log(
    `[App] Screen width: ${width}, isSmallScreen: ${isSmallScreen}, isWeb: ${isWeb}`
  );

  const positions = chessSelectors.usePositions();
  const currentIndex = chessSelectors.useCurrentPositionIndex();
  const canUndo = chessSelectors.useCanUndo();
  const canRedo = chessSelectors.useCanRedo();
  const undo = useChessStore((s) => s.undo);
  const redo = useChessStore((s) => s.redo);
  const setDemoHasRun = useChessStore((s) => s.setDemoHasRun);

  const responsiveStyles = {
    title: {
      fontSize: isSmallScreen ? 24 : isWeb ? 48 : 24,
    },
    label: {
      fontSize: isSmallScreen ? 16 : isWeb ? 48 : 16,
    },
    buttonText: {
      fontSize: isSmallScreen ? 16 : isWeb ? 48 : 16,
    },
    input: {
      fontSize: isSmallScreen ? 16 : isWeb ? 48 : 16,
    },
  };

  // console.log('[App] responsiveStyles:', JSON.stringify(responsiveStyles, null, 2));

  const handleDurationChange = (text: string) => {
    setInputValue(text);
    const duration = parseInt(text, 10);
    if (!isNaN(duration) && duration > 0) {
      setMoveAnimationDuration(duration);
    }
  };

  const handleArrowColorChange = (text: string) => {
    setArrowColorInput(text);
    if (text.match(/^#[0-9A-F]{6}$/i)) {
      setArrowColor(text);
    }
  };

  const handleArrowDurationChange = (text: string) => {
    setArrowDurationInput(text);
    const duration = parseInt(text, 10);
    if (!isNaN(duration) && duration >= 0) {
      setArrowDisplayDuration(duration);
    }
  };

  // FEN: White pawn on d5, black pawn on b4, black knight on c6, black king on g7
  // White to move. Promote pawn by taking: d5xc6, then c6xb7, then b7xa8
  const demoFen = 'r7/pp4k1/2n5/3P4/1p6/8/8/R2BK2R b - - 0 1';
  const manualFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const initialFen = mode === 'demo' ? demoFen : manualFen;
  const [demoKey, setDemoKey] = useState(0);
  const bumpDemoKey = React.useCallback(() => {
    setDemoKey((k) => k + 1);
  }, []);

  const handleRerunDemo = () => {
    useChessStore.getState().setPosition(initialFen);
    useChessStore.setState({
      arrows: [],
      animationState: 'idle',
      lastMove: null,
      moveHistory: [],
    });
    useChessStore.getState().setDemoHasRun(false);
    stopAutoMovesRef.current = false;
    bumpDemoKey();
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.contentContainer}
      scrollEnabled={!lockScroll}
    >
      <View style={styles.container}>
        {/* <Text style={[styles.title, responsiveStyles.title]}>
          Chessboard Demo
        </Text> */}

        <View style={styles.controlsContainer}>
          <View
            style={[styles.controlRow, isSmallScreen && styles.controlRowStack]}
          >
            <Text style={[styles.label, responsiveStyles.label]}>
              Move Duration (ms):
            </Text>
            <TextInput
              style={[
                styles.input,
                responsiveStyles.input,
                styles.controlInput,
                mode === 'manual' && styles.inputDisabled,
              ]}
              value={inputValue}
              onChangeText={handleDurationChange}
              placeholder={DEFAULT_MOVE_ANIMATION_DURATION.toString()}
              keyboardType="number-pad"
              editable={mode !== 'manual'}
            />
          </View>
          {/* <View
            style={[styles.controlRow, isSmallScreen && styles.controlRowStack]}
          >
            <Text style={[styles.label, responsiveStyles.label]}>
              Arrow Display (ms):
            </Text>
            <TextInput
              style={[
                styles.input,
                responsiveStyles.input,
                styles.controlInput,
                mode === 'manual' && styles.inputDisabled,
              ]}
              value={arrowDurationInput}
              onChangeText={handleArrowDurationChange}
              placeholder={DEFAULT_ARROW_DISPLAY_DURATION.toString()}
              keyboardType="number-pad"
              editable={mode !== 'manual'}
            />
          </View> */}
          <View
            style={[styles.controlRow, isSmallScreen && styles.controlRowStack]}
          >
            <Text style={[styles.label, responsiveStyles.label]}>
              Arrow Color:
            </Text>
            <TextInput
              style={[styles.input, responsiveStyles.input, styles.controlInput]}
              value={arrowColorInput}
              onChangeText={handleArrowColorChange}
              placeholder="#FFD700"
            />
          </View>
          {mode === 'lichess' && (
            <View
              style={[
                styles.controlRow,
                isSmallScreen && styles.controlRowStack,
                styles.controlRowInline,
              ]}
            >
              <Text style={[styles.label, responsiveStyles.label]}>Auto:</Text>
              <Switch value={autoPlay} onValueChange={setAutoPlay} />
              <View style={styles.apiStatus}>
                <View
                  style={[
                    styles.statusDot,
                    lichessStatus === 'ok' && styles.statusDotConnected,
                    lichessStatus === 'rate_limited' && styles.statusDotWarn,
                    lichessStatus === 'error' && styles.statusDotError,
                  ]}
                />
                <Text style={[styles.apiText, responsiveStyles.label]}>
                  API: {LICHESS_API_LABEL}
                </Text>
                {lichessStatus === 'rate_limited' && (
                  <Text style={styles.apiWarnText}>
                    server busy (429), try again later
                  </Text>
                )}
                {lichessStatus === 'error' && (
                  <Text style={styles.apiWarnText}>server unavailable</Text>
                )}
              </View>
            </View>
          )}
          <View
            style={[styles.controlRow, isSmallScreen && styles.controlRowStack]}
          >
            <Text style={[styles.label, responsiveStyles.label]}>
              Lock Scroll:
            </Text>
            <Switch value={lockScroll} onValueChange={setLockScroll} />
            {mode === 'demo' && (
              <Pressable
                style={({ pressed }) => [
                  styles.smallButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleRerunDemo}
              >
                <Text style={[styles.smallButtonText, responsiveStyles.buttonText]}>
                  Rerun Demo
                </Text>
              </Pressable>
            )}
          </View>

          {(mode === 'demo' || mode === 'manual') && (
          <View style={styles.buttonContainer}>
              <Text style={[styles.label, responsiveStyles.label]}>Positions?: <Text style={styles.value}>{positions.length}</Text></Text>
              <Text style={[styles.label, responsiveStyles.label]}>Current Index: <Text style={styles.value}>{currentIndex}</Text></Text>
              <Text style={[styles.label, responsiveStyles.label]}>Can Undo: <Text style={styles.value}>{canUndo ? 'Yes' : 'No'}</Text></Text>
              <Text style={[styles.label, responsiveStyles.label]}>Can Redo: <Text style={styles.value}>{canRedo ? 'Yes' : 'No'}</Text></Text>
              {/* <Button title="Test Move e2-e4" onPress={() => makeMove('e2', 'e4')} /> */}
              <TouchableOpacity
                style={[styles.customButton, !canUndo && styles.disabledButton]}
                onPress={() => {
                  if (isDemoRunning) {
                    stopAutoMovesRef.current = true;
                    setIsDemoRunning(false);
                    useChessStore.getState().clearArrows();
                  }
                  undo();
                }}
                disabled={!canUndo}
              >
                <Text style={[styles.customButtonText, canUndo ? { color: '#f0d9b5' } : { color: '#8a8a8a' }]}>Undo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.customButton, !canRedo && styles.disabledButton]}
                onPress={() => {
                  if (isDemoRunning) {
                    stopAutoMovesRef.current = true;
                    setIsDemoRunning(false);
                    useChessStore.getState().clearArrows();
                  }
                  redo();
                }}
                disabled={!canRedo}
              >
                <Text style={[styles.customButtonText, canRedo ? { color: '#f0d9b5' } : { color: '#8a8a8a' }]}>Redo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <ChessProvider
          moveAnimationDuration={moveAnimationDuration}
          arrowDisplayDuration={arrowDisplayDuration}
        >
          <Chessboard
            key={demoKey}
            position={initialFen}
            boardSize={
              Dimensions.get('window').width > Dimensions.get('window').height
                ? Dimensions.get('window').width * 0.4
                : Dimensions.get('window').height * 0.4
            }
            showCoordinates={true}
            autoPromoteToQueen={false}
            arrowColor={arrowColor}
            onMove={({ from, to, promotion }) => {
              log('[App] Move made:', { from, to, promotion });
            }}
            onUserInteraction={() => {
              if (!isDemoRunning) return;
              stopAutoMovesRef.current = true;
              useChessStore.getState().clearArrows();
              return true;
            }}
          />

          <ChessDemoEffects
            mode={mode}
            autoPlay={autoPlay}
            initialFen={initialFen}
            demoKey={demoKey}
            stopAutoMovesRef={stopAutoMovesRef}
            isDemoRunning={isDemoRunning}
            setIsDemoRunning={setIsDemoRunning}
            onBumpDemoKey={bumpDemoKey}
            onLichessStatusChange={setLichessStatus}
          />
        </ChessProvider>

        <View style={styles.tabBar}>
          {[
            { key: 'demo', label: 'Demo' },
            { key: 'manual', label: 'Manual' },
            { key: 'lichess', label: 'Lichess' },
          ].map((tab) => {
            const isActive = mode === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => {
                  if (tab.key === 'demo' && mode !== 'demo') {
                    setDemoHasRun(false);
                  }
                  setMode(tab.key as typeof mode);
                }}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
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
    fontSize: 24,
    marginBottom: 12,
    fontWeight: '600',
    color: '#f0d9b5',
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  controlsContainer: {
    alignSelf: 'stretch',
    marginHorizontal: 12,
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
    justifyContent: 'flex-start',
  },
  controlRowInline: {
    justifyContent: 'flex-start',
    gap: 12,
  },
  controlRowStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  controlInput: {
    flex: 1,
    minWidth: 120,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#f0d9b5',
    flexShrink: 1,
  },
  value: {
    color: '#00FF7F',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#1e1e1e',
    color: '#e6e6e6',
  },
  inputDisabled: {
    backgroundColor: '#2a2a2a',
    color: '#8a8a8a',
    borderColor: '#3a3a3a',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#2a2a2a',
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabBar: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#1e1e1e',
  },
  tabButtonActive: {
    borderColor: '#f0d9b5',
  },
  tabText: {
    color: '#e6e6e6',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#f0d9b5',
  },
  apiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#444',
    borderWidth: 1,
    borderColor: '#666',
  },
  statusDotConnected: {
    backgroundColor: '#00ff66',
    borderColor: '#00ff66',
  },
  statusDotWarn: {
    backgroundColor: '#ff3b30',
    borderColor: '#ff3b30',
  },
  statusDotError: {
    backgroundColor: '#ff3b30',
    borderColor: '#ff3b30',
  },
  apiText: {
    color: '#e6e6e6',
    fontSize: 12,
  },
  apiWarnText: {
    color: '#ff3b30',
    fontSize: 12,
  },
});
