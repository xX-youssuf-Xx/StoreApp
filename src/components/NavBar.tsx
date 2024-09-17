import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';

interface NavBarProps {
  title: string;
}

const NavBar: React.FC<NavBarProps> = ({ title }) => {
  const navigation = useNavigation<NavigationProp<any>>();

  return (
    <View style={{ height: 60, backgroundColor: 'blue', justifyContent: 'center', paddingHorizontal: 10 }}>
      <Text style={{ color: 'white', fontSize: 18 }}>{title}</Text>
      <TouchableOpacity
        style={{ position: 'absolute', right: 10, top: 15 }}
        onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} // Use DrawerActions
      >
        <Text style={{ color: 'white', fontSize: 18 }}>☰</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NavBar;
