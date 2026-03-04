// ambient declarations for packages that are only installed in the example workspace
// this lets the library compile at the repo root without adding those packages as
// devDependencies. the real implementations/types live in example/node_modules.

// core rendering libs (also peer dependencies of the library)
declare module 'react' {
  export = React;
}

declare namespace React {
  type FC<P = {}> = React.FunctionComponent<P>;
  type FunctionComponent<P = {}> = (props: P) => JSX.Element | null;
  type ReactNode = string | number | boolean | null | undefined | JSX.Element;
  type MutableRefObject<T> = { current: T };

  function createContext<T>(defaultValue: T): React.Context<T>;
  interface Context<T> {
    Provider: React.Provider<T>;
    Consumer: React.Consumer<T>;
    displayName?: string;
  }
  interface Provider<T> {
    (props: { value: T; children?: React.ReactNode }): JSX.Element | null;
  }
  interface Consumer<T> {
    (props: { children: (value: T) => React.ReactNode }): JSX.Element | null;
  }

  function useState<T>(
    initialValue: T | (() => T)
  ): [T, (value: T | ((prev: T) => T)) => void];
  function useRef<T>(initialValue: T): React.MutableRefObject<T>;
  function useCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: any[]
  ): T;
  function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  function useLayoutEffect(
    effect: () => void | (() => void),
    deps?: any[]
  ): void;
  function useMemo<T>(factory: () => T, deps: any[]): T;
  function useContext<T>(context: React.Context<T>): T;
  function memo<T extends React.FC<any>>(
    component: T,
    propsAreEqual?: (prevProps: any, nextProps: any) => boolean
  ): T;
}

declare module 'react/jsx-runtime' {
  export const Fragment: any;
  export const jsx: any;
  export const jsxs: any;
}

// react native and related packages are only installed in the example workspace
declare module 'react-native' {
  export const View: any;
  export const Text: any;
  export const Image: any;
  export const StyleSheet: any;
  export const Modal: any;
  export const Platform: any;
  export const Dimensions: any;
  export const ScrollView: any;
  export const Pressable: any;
  export const TextInput: any;
  export const Switch: any;
  export const TouchableOpacity: any;
  export const useWindowDimensions: any;
  export type ImageSourcePropType = any;
  export type ViewStyle = any;
}

declare module 'react-native-svg' {
  export const Svg: any;
  export const Path: any;
}

declare module 'react-native-gesture-handler' {
  export const GestureHandlerRootView: any;
  export const GestureDetector: any;
  export const Gesture: any;
}

declare module 'react-native-reanimated' {
  export const Animated: any;
  export const View: any;
  export const Image: any;
  export const useAnimatedStyle: any;
  export const useSharedValue: any;
  export const runOnJS: any;
  export const Easing: any;
  export const withTiming: any;
  export const withSequence: any;
  export const interpolate: any;
  export const useAnimatedReaction: any;
  export type AnimatedStyleProp = any;
  export type ViewStyle = any;
}

declare module 'react-native-worklets' {
  export const runOn: any;
}

declare module 'react-test-renderer' {
  export const act: any;

  interface ReactTestRenderer {
    root: any;
    update(element: any): void;
    unmount(): void;
  }

  function create(element: any): ReactTestRenderer;
  export default create;
}
