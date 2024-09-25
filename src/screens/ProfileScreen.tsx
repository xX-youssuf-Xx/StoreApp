import React from 'react';
import { View, Text } from 'react-native';
import NavBar from '../components/NavBar';

const ProfileScreen = () => {
  return (
    <View style={{ flex: 1 , backgroundColor:'red' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Profile Screen</Text>
      </View>
    </View>
  );
};

export default ProfileScreen;
