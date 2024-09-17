import React from 'react';
import { View, Text } from 'react-native';
import NavBar from '../components/NavBar';

const FoodStorageScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <NavBar title="Food Storage" />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Food Storage Screen</Text>
      </View>
    </View>
  );
};

export default FoodStorageScreen;
