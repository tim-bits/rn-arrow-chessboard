// ambient declarations for packages that are only installed in the example workspace
// this lets the library compile at the repo root without adding those packages as
// devDependencies. the real implementations/types live in example/node_modules.

// core rendering libs (also peer dependencies of the library)
declare module 'react';
declare module 'react/jsx-runtime';

// react native and related packages are only installed in the example workspace
declare module 'react-native';
declare module 'react-native-svg';
declare module 'react-native-gesture-handler';
declare module 'react-native-reanimated';
declare module 'react-native-worklets';
declare module 'react-test-renderer';
