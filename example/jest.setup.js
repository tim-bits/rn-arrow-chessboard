// Lightweight virtual mock for react-native-reanimated (no native deps needed)
jest.mock(
  'react-native-reanimated',
  () => {
    const React = require('react');
    const createHost = (type) => {
      const Comp = ({ children, ...rest }) =>
        React.createElement(type, rest, children);
      return Comp;
    };
    const View = createHost('AnimatedView');
    const Image = createHost('AnimatedImage');
    const identity = (v) => (typeof v === 'function' ? v() : v);
    return {
      default: View,
      View,
      Image,
      Easing: {
        out: (fn) => fn,
        in: (fn) => fn,
        quad: () => null,
        linear: () => null,
      },
      withTiming: (v) => identity(v),
      withSequence: (...args) => args[args.length - 1],
      useSharedValue: (v) => ({ value: v }),
      useAnimatedStyle: (fn) => fn,
      runOnJS: (fn) => fn,
    };
  },
  { virtual: true }
);
// RN core helper may not exist in this workspace; guard mock
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), {
  virtual: true,
});

// Provide a lightweight virtual mock for react-native to run RN-less tests
jest.mock(
  'react-native',
  () => {
    const React = require('react');
    const createHost = (type) => {
      const Comp = ({ children, ...rest }) =>
        React.createElement(type, rest, children);
      return Comp;
    };
    const View = createHost('View');
    const Image = createHost('Image');
    const StyleSheet = { create: (obj) => obj };
    return {
      View,
      Image,
      StyleSheet,
    };
  },
  { virtual: true }
);

// Ensure expo winter import doesn't break tests; mock expo entry point
jest.mock('expo', () => {
  return {
    // minimal mocks if needed
  };
});
