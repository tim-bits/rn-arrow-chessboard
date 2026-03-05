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

## Components

### ChessProvider

Initializes store settings before any chessboard renders.

**Props**

- `moveAnimationDuration?: number` – move animation duration in ms
- `children: React.ReactNode`

### Chessboard

Interactive board with gestures, promotion dialog, and arrows.

```tsx
<Chessboard
  position="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  orientation="white"
  boardSize={320}
  showCoordinates={true}
  autoPromoteToQueen={false}
  arrowColor="#FFD700"
  onMove={({ from, to, promotion }) => {
    console.log('Move:', { from, to, promotion });
  }}
/>
```

**Props**

- `position?: FenString` – board position in FEN, or `"start"` (default)
- `orientation?: 'white' | 'black'` – board perspective (default: `"white"`)
- `boardSize?: number` – board size in pixels (default: `320`)
- `showCoordinates?: boolean` – show rank/file labels (default: `false`)
- `autoPromoteToQueen?: boolean` – auto-promote if no piece chosen (default: `true`)
- `arrowColor?: string` – arrow color (default: `#FFD700`)
- `onMove?: (move) => void` – `{ from, to, promotion? }`
- `onUserInteraction?: () => boolean | void` – return `true` to ignore the gesture (useful to stop demos)



## Hooks

### useChessboardAnimation

Programmatic move orchestration with arrows and animation timing.

```tsx
import { useChessboardAnimation } from 'rn-arrow-chessboard';

function Orchestrator() {
  const { move, arrows } = useChessboardAnimation();

  const play = async () => {
    await arrows([
      ['e2', 'e4'],
      ['d2', 'd4'],
    ]);
    await move('e2', 'e4');
  };

  return <Button title="Play" onPress={play} />;
}
```

**Returns**

- `move(from, to, promotion?) -> Promise<boolean>`
- `arrows(pairs) -> Promise<void>`
- `animationState`
- `isAnimating`

## Adapters (Optional)

Adapters are drop-in helpers for fetching engine suggestions. They are **optional**: you can use them in demos or client apps without changing core behavior.

### Types

```ts
export type SuggestionMove = {
  from: string;
  to: string;
  promotion?: string;
};

export type SuggestionResult = {
  arrows: [string, string][];
  bestMove?: SuggestionMove;
  eval?: number | string;
};

export interface ChessSuggestionAdapter {
  getSuggestions(fen: string): Promise<SuggestionResult>;
}
```

### Lichess Cloud Adapter

```ts
import { createLichessCloudAdapter } from 'rn-arrow-chessboard';

const adapter = createLichessCloudAdapter({ multiPv: 3 });
const {
  arrows,
  bestMove,
  eval: evaluation,
} = await adapter.getSuggestions(fen);
```

Notes:

- Lichess rate limits apply (expect `429` on burst usage).
- `multiPv` controls how many candidate lines you get back.

## Arrows

Arrows are ordered by priority: the first arrow is the thickest.

```tsx
await arrows([
  ['e2', 'e4'], // primary
  ['d2', 'd4'], // secondary
]);
```

Arrow timing is controlled by `ChessProvider`:

```tsx
<ChessProvider moveAnimationDuration={1500}>
  ...
</ChessProvider>
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
