import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import LottieView from 'lottie-react-native';
import { View } from 'react-native';

// Screens
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import ClientsScreen from './screens/ClientsScreen';
import FoodStorageScreen from './screens/FoodStorageScreen';

// Components
import Menu from './components/Menu';

const Drawer = createDrawerNavigator();

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Simulate fetching data
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* <LottieView source={require('./assets/splash-animation.json')} autoPlay loop /> */}
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={(props) => <Menu {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Drawer.Screen name="Home" component={HomeScreen} />
        <Drawer.Screen name="Profile" component={ProfileScreen} />
        <Drawer.Screen name="Clients" component={ClientsScreen} />
        <Drawer.Screen name="FoodStorage" component={FoodStorageScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
};

export default App;
