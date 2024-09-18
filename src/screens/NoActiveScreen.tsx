import React from 'react';
import { View, Text } from 'react-native';
import NavBar from '../components/NavBar';

const NoActiveScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>NoActiveScreen</Text>
      </View>
    </View>
  );
};

export default NoActiveScreen;
