# moveAnimationDuration Prop Fix - Implementation Notes

## Problem Identified

The `moveAnimationDuration` prop was being ignored due to an **initialization timing race condition**:

1. **Store default** is eagerly read by hooks before props can initialize it
2. **Prop → store sync** happens in `useLayoutEffect`, which runs after component mount
3. If moves trigger before/during initial render, the hook closure already holds the stale value

```
Timeline:
[Hook invocation] → reads 5050 from store (default)
    ↓
[Props received] → ChessSurfaceInteractive mounts
    ↓
[useLayoutEffect] → calls setMoveAnimationDuration(3000)
    ↓
BUT: Hook already captured 5050 in closure!
```

## Solutions Implemented

### Solution A: ChessProvider (Recommended)

**New file:** `src/ui/ChessProvider.tsx`

A top-level provider that initializes store configuration **before any child components run**:

```tsx
<ChessProvider moveAnimationDuration={3000}>
  <ChessSurfaceInteractive />
</ChessProvider>
```

**Why this works:**
- `useLayoutEffect` with empty dependency array runs synchronously during provider mount
- All descendant hooks see the correct value from the start
- No race conditions
- Zero API changes to existing components

### Solution B: Direct Duration Override

**Modified:** `src/hooks/useChessboardAnimation.ts`

The hook now accepts an optional override parameter:

```tsx
const animation = useChessboardAnimation(moveAnimationDuration);
```

**Why this works:**
- Bypasses store timing issues entirely
- Direct prop flow to animation logic
- Can be used alongside ChessProvider for maximum clarity

## What This Fixes

✅ Deterministic animation duration behavior  
✅ Prop value now correctly overrides store default  
✅ No more "wrong duration" logs mid-animation  
✅ Eliminates race conditions on initial render  

## Usage Examples

### With ChessProvider (Recommended)

```tsx
function App() {
  return (
    <ChessProvider moveAnimationDuration={3000}>
      <ChessSurfaceInteractive position="start" />
    </ChessProvider>
  );
}
```

### With Direct Override

```tsx
function MyComponent() {
  const MOVE_DURATION = 3000;
  const { move } = useChessboardAnimation(MOVE_DURATION);
  
  return (
    <ChessSurfaceInteractive
      moveAnimationDuration={MOVE_DURATION}
      onMove={() => move(...)}
    />
  );
}
```

### Combined (Most Explicit)

```tsx
function App() {
  const MOVE_DURATION = 3000;
  
  return (
    <ChessProvider moveAnimationDuration={MOVE_DURATION}>
      <ChessSurfaceInteractive moveAnimationDuration={MOVE_DURATION} />
    </ChessProvider>
  );
}
```

## Migration Guide

**If you were already passing `moveAnimationDuration` to ChessSurfaceInteractive:**

1. Wrap your component tree with `ChessProvider`:
```tsx
import { ChessProvider } from 'rn-chessboard-lib';

<ChessProvider moveAnimationDuration={yourDuration}>
  <ChessSurfaceInteractive />
</ChessProvider>
```

2. The `moveAnimationDuration` prop to ChessSurfaceInteractive is still respected but now works reliably

**If you use `useChessboardAnimation` directly:**

1. Optionally pass duration to the hook:
```tsx
const { move } = useChessboardAnimation(3000);
```

## Technical Details

### Root Cause Analysis

- **Store initialization:** `moveAnimationDuration: 5050` (default in chessStore.ts)
- **Hook consumption:** `useChessboardAnimation()` reads via selector immediately
- **Prop sync:** Happens in `useLayoutEffect` (too late for first render)
- **Result:** Closure captures stale value before prop updates reach store

### Why Other Solutions Don't Work

❌ useLayoutEffect vs useEffect (already optimal - both too late)  
❌ Changing dependency arrays (doesn't address initialization order)  
❌ Zustand selector optimization (not the bottleneck)  
❌ Reset logic (doesn't prevent initial capture)  

### Why This Works

✅ ChessProvider runs during provider mount (before children)  
✅ Empty dependency array ensures one-time initialization  
✅ Direct override option bypasses store timing entirely  
✅ Architecture now matches initialization flow  

## Files Changed

1. **Created:** `src/ui/ChessProvider.tsx` - Store initialization provider
2. **Modified:** `src/hooks/useChessboardAnimation.ts` - Accept duration override
3. **Modified:** `example/src/App.tsx` - Use ChessProvider pattern
