const React = require('react');
const createHost =
  (t) =>
  ({ children, ...rest }) =>
    React.createElement(t, rest, children);
const View = createHost('View');
const Image = createHost('Image');
const StyleSheet = { create: (o) => o };
module.exports = {
  View,
  Image,
  StyleSheet,
  Platform: { OS: 'test' },
  Dimensions: { get: () => ({ width: 320, height: 640 }) },
  Pressable: createHost('Pressable'),
  Text: createHost('Text'),
  TouchableOpacity: createHost('TouchableOpacity'),
  ScrollView: createHost('ScrollView'),
  Switch: createHost('Switch'),
  TextInput: createHost('TextInput'),
};
