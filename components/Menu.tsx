import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';

const Menu: React.FC<DrawerContentComponentProps> = ({ navigation }) => {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TouchableOpacity onPress={() => { navigation.navigate('Home'); navigation.closeDrawer(); }}>
        <Text>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { navigation.navigate('Profile'); navigation.closeDrawer(); }}>
        <Text>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { navigation.navigate('Clients'); navigation.closeDrawer(); }}>
        <Text>Clients</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { navigation.navigate('FoodStorage'); navigation.closeDrawer(); }}>
        <Text>Food Storage</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Menu;
