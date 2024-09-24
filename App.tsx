import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ClientsScreen from './src/screens/ClientsScreen';
import FoodStorageScreen from './src/screens/FoodStorageScreen';
// Components
import Menu from './src/components/Menu';
import { getItem, setItem } from './src/utils/localStorage';
import { getActiveUser, setActiveUser } from './src/utils/auth';
import { FIREBASE_ERROR } from './src/config/Constants';
import { FirebaseError } from './src/errors/FirebaseError';
import { useFirebase } from './src/context/FirebaseContext';
import { useLoading } from './src/context/LoadingContext';

const Drawer = createDrawerNavigator();

const App: React.FC = () => {
  const { forceLoading, setForceLoading } = useLoading();
  const { db } = useFirebase();

  const checkAuth = async () => {
    try {
      // CHECK IF THERE IS AN NAME IN THE STORAGE
      const name = await getItem('name');
      if(!name) {
        // JOE:  GO TO LOGIN PAGE
        return true;
      }
      
      // CHECK IF ACTIVE FROM STORAGE
      const active = await getItem('active');
      if (active) {
        // JOE:  GO TO HOME 
        return true;
      }
  
      const activeUser = await getActiveUser(db!);
  
      if(!activeUser) {
        const res = await setActiveUser(db!, name);  
        if(res) {
          // JOE:  GO TO THERE IS NO ACTIVE USER DO YOU WANT TO BE ACTIVE??
          return true;
        }
      }
  
      if(activeUser.val() === name) {
        await setItem('active', true);
        // JOE:  GO TO HOME 
        return true;
      }
  
      // JOE:  GO TO INACTIVE PAGE (show the user that there is already another user active and he should backup there first before being able to work here)
      return true;
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERROR) {
          // JOE:  SHOW ERROR MESSAGE THAT THE USER SHOULD TRY AGAIN LATER
        } else {
            console.error('An error occurred with code:', error.code);
        }
      } else {
          console.error('An unexpected error occurred:', error);
      }
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  if (forceLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* JOE: LOADING SCREEN */}
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
      {
      
      }
    </GestureHandlerRootView>
  );
};

export default App;
