# rn-arrow-chessboard

A React Native chessboard component library with interactive play, animations, position history, and suggestion arrows. It uses Zustand for state management and keeps the API small and practical.

## Features

- Interactive chessboard with drag-and-drop movement
- Read-only board display
- Configurable move animation duration
- Suggestion arrows (priority via ordering)
- Promotion dialog support
- Arrow styling (color, thickness, opacity)
- Full TypeScript support

## Installation

### Peer Dependencies

Install these in your app:

```sh
npm install react-native-gesture-handler react-native-reanimated react-native-svg zustand
```

Or with yarn:

```sh
yarn add react-native-gesture-handler react-native-reanimated react-native-svg zustand
```

### Add the library (while not published to npm)

Local path (adjacent folder/monorepo):

```sh
yarn add ../rn-arrow-chessboard
# or
npm install ../rn-arrow-chessboard
```

Git URL:

```sh
yarn add git+https://github.com/tim-bits/rn-arrow-chessboard.git
# or
npm install git+https://github.com/tim-bits/rn-arrow-chessboard.git
```





## Quick Start

Wrap your app in `ChessProvider` so the store is initialized before components mount.

```tsx
import { ChessProvider, Chessboard } from 'rn-arrow-chessboard';

export default function App() {
  return (
    <ChessProvider moveAnimationDuration={300}>
      <Chessboard
        position="start"
        boardSize={320}
        onMove={({ from, to, promotion }) => {
          console.log('Move:', { from, to, promotion });
        }}
      />
    </ChessProvider>
  );
}
```

---

## Component API

### ChessProvider
| prop | type | default | notes |
| --- | --- | --- | --- |
| `moveAnimationDuration?` | number (ms) | `300` | Time a programmatic move stays in “animating” state. |
| `arrowDisplayDuration?` | number (ms) | `500` | How long arrows remain visible after `arrows()` resolves. |
| `children` | React.ReactNode | — | Required wrapper. |

### Chessboard
| prop | type | default | notes |
| --- | --- | --- | --- |
| `position?` | `FenString` \| `"start"` | `"start"` | Setting a new FEN resets selection, arrows, queue, and history. |
| `orientation?` | `'white' \| 'black'` | `"white"` | If you pass `"white"`, the stored orientation is used (initially white). |
| `boardSize?` | number (px) | `320` | Rounded down to the nearest multiple of 8 to avoid hairline gaps. |
| `showCoordinates?` | boolean | `false` | Adds rank/file labels sized with `useResponsiveCoordinateSize`. |
| `autoPromoteToQueen?` | boolean | `true` | If `false`, a modal prompts for piece on promotion moves. |
| `arrowColor?` | string | `#FFD700` | Sets the global arrow color in the store. |
| `onMove?` | `(move) => void` | — | Called when a move actually starts (after validation/queue flush). |
| `onUserInteraction?` | `() => boolean \| void` | — | Called on tap/drag start; return `true` to block the gesture (useful to lock the board during scripted demos). |
| `moveAnimationDuration?` | number | — | Currently ignored on the component; set it via `ChessProvider`. |

Built-ins:
- Gestures are wrapped in an internal `GestureHandlerRootView`; no extra wrapper needed.
- Only the side-to-move pieces can be dragged/tapped.

### PromotionDialog (exported)
Props: `visible`, `color: 'w' | 'b'`, `onSelect(piece)`, `onCancel()`. You normally don’t render it yourself; Chessboard shows it when needed, but you can import and reuse it for custom flows.

---


## Hooks

### useChessboardAnimation
Programmatic control with built-in timing.

```tsx
import { useChessboardAnimation } from 'rn-arrow-chessboard';

const Demo = () => {
  const { move, arrows, isAnimating } = useChessboardAnimation();

  const play = async () => {
    await arrows([['e2', 'e4'], ['d2', 'd4']]); // rendered + held for arrowDisplayDuration
    await move('e2', 'e4');                      // waits moveAnimationDuration
  };

  return <Button title={isAnimating ? 'Playing…' : 'Play line'} onPress={play} />;
};
```

Returns:
- `move(from, to, promotion?) => Promise<boolean>`
- `arrows(pairs: ArrowPair[]) => Promise<void>` (clears previous arrows, waits render frames + `arrowDisplayDuration`)
- `isAnimating`
- `animationState` (`'idle' | 'animating' | 'arrowsUpdating'`)

### useChessStore / chessSelectors (advanced)
All store state & setters are exported for custom UI (clocks, move list, controls).

Example undo/redo toolbar:

```tsx
import { useChessStore, chessSelectors } from 'rn-arrow-chessboard';

function HistoryBar() {
  const canUndo = chessSelectors.useCanUndo();
  const canRedo = chessSelectors.useCanRedo();
  const undo = useChessStore((s) => s.undo);
  const redo = useChessStore((s) => s.redo);

  return (
    <>
      <Button title="Undo" disabled={!canUndo} onPress={undo} />
      <Button title="Redo" disabled={!canRedo} onPress={redo} />
    </>
  );
}
```

Other handy selectors: `useFen`, `useBoard`, `useMoveHistory`, `useArrows`, `useArrowColor`, `useMoveAnimationDuration`, `useArrowDisplayDuration`, `useControlledMode`, `useCurrentPositionIndex`.

### useResponsiveSize / useResponsiveCoordinateSize
Responsive sizing utilities; `useResponsiveCoordinateSize` is what Chessboard uses for coordinate labels if `showCoordinates` is true.

---

## Arrows: How They Work

- Configure color: pass `arrowColor` to `Chessboard` (defaults to gold).
- Priority: `arrows[0]` draws thickest; each subsequent arrow is ~70% the previous thickness. Base thickness ≈ `squareSize * 0.15`.
- Orientation-aware: coordinates respect the current board orientation.
- Duration: `useChessboardAnimation().arrows()` waits two RAFs for render, then holds for `arrowDisplayDuration` (configurable in `ChessProvider`).

Example with custom color and slower arrow hold:

```tsx
<ChessProvider>
  <Chessboard arrowColor="#4ade80" />
</ChessProvider>
```

Engine suggestions example (Lichess Cloud):

```tsx
import { useChessboardAnimation, createLichessCloudAdapter } from 'rn-arrow-chessboard';

const adapter = createLichessCloudAdapter({ multiPv: 3 });

async function showIdeas(fen: string) {
  const { arrows, move } = useChessboardAnimation();
  const { arrows: ideas, bestMove } = await adapter.getSuggestions(fen);
  await arrows(ideas);
  if (bestMove) await move(bestMove.from, bestMove.to, bestMove.promotion);
}
```

## Promotion Flow

If `autoPromoteToQueen` is `false`, promotion moves pause and the promotion dialog appears. Once a piece is selected, the move continues.

## Troubleshooting

### Changes not appearing

- App code: `example/src/App.tsx`
- Library code: `src/**`

If needed:

```sh
yarn bob build
cd example
yarn cache clean && yarn install
npx expo start -w -c --reset-cache
```

### Animation duration not applied

Wrap the component subtree that uses chess hooks/components with `ChessProvider`.
Hooks read store values on mount:

```tsx
<ChessProvider moveAnimationDuration={1500}>
  <Chessboard
    position="start"
    boardSize={320}
    onMove={({ from, to, promotion }) => {
      console.log('Move:', { from, to, promotion });
    }}
  />
</ChessProvider>
```

## Lichess Demo (Example App)

The example app includes a Lichess-powered mode that polls Cloud Eval and draws arrows.
It uses the adapter internally, but the flow is the same if you wire it yourself:

```ts
import { createLichessCloudAdapter } from 'rn-arrow-chessboard';

const adapter = createLichessCloudAdapter({ multiPv: 3 });
const { arrows, bestMove } = await adapter.getSuggestions(fen);

// draw arrows
await arrows(arrows);

// optional autoplay
if (bestMove) {
  await move(bestMove.from, bestMove.to, bestMove.promotion);
}
```

## Roadmap

### Planned Features

- **Themes & Styling**: Custom board themes, piece sets, and color schemes
- **Sound Effects**: Move sounds
- **Performance**: Further optimizations for large position databases
- **Export/Import**: PGN and FEN export/import functionality


## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
