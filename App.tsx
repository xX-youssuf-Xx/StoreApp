import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { firebase } from '@react-native-firebase/database';

// Screens
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import ClientsScreen from './screens/ClientsScreen';
import FoodStorageScreen from './screens/FoodStorageScreen';
// Components
import Menu from './components/Menu';
import { getItem, setItem } from './utils/localStorage';

const Drawer = createDrawerNavigator();

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const database = firebase
    .app()
    .database('https://storeapp-44934-default-rtdb.europe-west1.firebasedatabase.app');

  const checkAuth = async () => {
    // CHECK IF THERE IS AN NAME IN THE STORAGE
    const name = await getItem('name');
    if(!name) {
      // HERE: GO TO LOGIN PAGE
      return true;
    }
    
    // CHECK IF ACTIVE FROM STORAGE
    const active = await getItem('active');
    if (active) {
      // HERE: GO TO HOME 
      return true;
    }
    
    database.ref('/activeUser')
      .once('value')
      .then(snapshot => {
        if(snapshot.val() == name) {
          // HERE: GO TO HOME 
          setItem('active', true);
        } else {
          // HERE: GO TO INACTIVE PAGE (show the user that there is already another user active and he should backup there first before being able to work here)
        }
      });
  }

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {
          <Text>Test</Text>
        }
        {/* { databaseForDefaultApp   } */}
        {/* Uncomment the following line if you have the LottieView component set up */}
        {/* <LottieView source={require('./assets/splash-animation.json')} autoPlay loop /> */}
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Drawer.Navigator
          drawerContent={props => <Menu {...props} />}
          screenOptions={{
            headerShown: false,
            drawerPosition: 'right', // This makes the drawer come from the right
          }}>
          <Drawer.Screen name="Home" component={HomeScreen} />
          <Drawer.Screen name="Profile" component={ProfileScreen} />
          <Drawer.Screen name="Clients" component={ClientsScreen} />
          <Drawer.Screen name="FoodStorage" component={FoodStorageScreen} />
        </Drawer.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;
