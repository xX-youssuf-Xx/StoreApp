// module.exports = {
//   presets: ['module:@react-native/babel-preset' , 'module:metro-react-native-babel-preset'],
//   plugins: ['react-native-reanimated/plugin'],
// };


module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['@babel/plugin-transform-private-methods', { loose: true }],
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['@babel/plugin-transform-private-property-in-object', { loose: true }],
    // Add any other plugins you need here
  ],
};