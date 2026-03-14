import renderer, { act } from 'react-test-renderer';
import BoardView from '../../src/ui/components/BoardView';
import MoveOverlay from '../../src/ui/components/MoveOverlay';

// Mock BoardSquare so we can inspect calls without rendering RN views
jest.mock('../../src/ui/components/BoardSquare', () => {
  const mock = jest.fn(() => null);
  return {
    __esModule: true,
    BoardSquare: mock,
    default: mock,
  };
});
// Import the mock after it's defined
const { BoardSquare: BoardSquareMock } =
  require('../../src/ui/components/BoardSquare') as {
    BoardSquare: jest.Mock;
  };

const fakeImg = { uri: 'piece.png' };

describe('BoardView', () => {
  const rows = Array.from({ length: 8 }, (_ignored, r) =>
    Array.from({ length: 8 }, (_ignored2, f) => ({
      key: `${r}-${f}`,
      squareNotation: `${String.fromCharCode(97 + f)}${8 - r}`,
      isLight: (r + f) % 2 === 0,
      pieceKey: r === 7 && f === 4 ? 'bK' : null,
      pieceImage: fakeImg,
    }))
  );

  it('renders 64 squares and marks selection/drag', () => {
    BoardSquareMock.mockClear();
    act(() => {
      (renderer as any).create(
        <BoardView
          rows={rows}
          squareSize={40}
          selectedSquare="e1"
          legalMovesSet={new Set(['e2'])}
          isCheck={false}
          isCheckmate={false}
          kingSquare="e8"
          draggedSquare="a1"
          animatedFrom="b2"
          animatedTo="b3"
          disablePop={false}
        />
      );
    });
    expect(BoardSquareMock).toHaveBeenCalledTimes(64);
    const propsList = BoardSquareMock.mock.calls.map((c: any[]) => c[0]);
    expect(propsList.some((p) => p.isSelected)).toBe(true);
    expect(propsList.some((p) => p.isDragged)).toBe(true);
  });
});

describe('MoveOverlay', () => {
  const anim = {
    from: 'e2',
    to: 'e4',
    image: fakeImg,
    captured: { square: 'e4', image: fakeImg },
  };
  it('shows moving piece and captured overlay when present', () => {
    let testRenderer: any;
    act(() => {
      testRenderer = (renderer as any).create(
        <MoveOverlay
          squareSize={40}
          animatedMove={anim}
          capturedOverlayPos={{ left: 10, top: 20 }}
          movePieceStyle={{ transform: [{ translateX: 5 }] }}
        />
      );
    });
    const images = (testRenderer as any).root.findAll(
      (n: any) => n.type === 'Image' || n.type === 'AnimatedImage'
    );
    expect(images.length).toBe(2); // captured + mover

    act(() => {
      (testRenderer as any).update(
        <MoveOverlay
          squareSize={40}
          animatedMove={null}
          capturedOverlayPos={null}
          movePieceStyle={{}}
        />
      );
    });
    const imagesNone = (testRenderer as any).root.findAll(
      (n: any) => n.type === 'Image' || n.type === 'AnimatedImage'
    );
    expect(imagesNone.length).toBe(0);
  });
});
