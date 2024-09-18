import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

interface NavBarProps {
  title: string;
}

const NavBar: React.FC<NavBarProps> = ({ title }) => {
  const navigation = useNavigation<NavigationProp<any>>();

  // Safely check if navigation and its state exist
  const state = navigation.getState ? navigation.getState() : null;
  const currentRoute = state ? state.routes[state.index].name : 'Home';  // Default to 'Home'

  return (
    <View style={{ height: 60, backgroundColor: '#f8f8f8', justifyContent: 'center', paddingHorizontal: 10 }}>
      <Text style={{ color: '#000', fontSize: 18, textAlign: 'right' }}>{title}</Text>
      <TouchableOpacity
        style={{ position: 'absolute', left: 10, top: 15 }}
        onPress={() => {
          if (currentRoute === 'Home') {
            navigation.navigate('Settings');
          } else {
            navigation.goBack();
          }
        }}
      >
        <Text style={{ color: '#000', fontSize: 18 }}>
          {currentRoute === 'Home' ? '⚙️' : '⬅️'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default NavBar;
