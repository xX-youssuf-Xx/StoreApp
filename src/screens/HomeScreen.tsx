import React, { useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import NavBar from '../components/NavBar';
import { useFirebase } from '../context/FirebaseContext';

// Define your route types (you can replace 'Home', 'Profile', etc. with your actual route names)
type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Clients: undefined;
  FoodStorage: undefined;
};

// Define the type for navigation prop
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { db, goOffline } = useFirebase();

  useEffect(() => {
    goOffline();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <NavBar title="Home" />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Home Screen</Text>
        <Button title="Go to Profile" onPress={() => navigation.navigate('Profile')} />
        <Button title="Go to Clients" onPress={() => navigation.navigate('Clients')} />
        <Button title="Go to Food Storage" onPress={() => navigation.navigate('FoodStorage')} />
      </View>
    </View>
  );
};

export default HomeScreen;
