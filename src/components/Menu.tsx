import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';

const Menu: React.FC<DrawerContentComponentProps> = ({ navigation }) => {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TouchableOpacity onPress={() => { navigation.navigate('Home'); navigation.closeDrawer(); }}>
        <Text style={{color:'black' , marginBottom :'30%' , marginTop : '30%'}}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { navigation.navigate('Profile'); navigation.closeDrawer(); }}>
        <Text style={{color:'black' , marginBottom :'30%'}}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { navigation.navigate('Clients'); navigation.closeDrawer(); }}>
        <Text style={{color:'black' , marginBottom :'30%'}}>Clients</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { navigation.navigate('FoodStorage'); navigation.closeDrawer(); }}>
        <Text style={{color:'black' , marginBottom :'30%'}}>Food Storage</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Menu;
