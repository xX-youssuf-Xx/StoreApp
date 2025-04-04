/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState} from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import LottieView from 'lottie-react-native';
import FlashMessage, {showMessage} from 'react-native-flash-message';
import {FirebaseProvider} from './src/context/FirebaseContext';
import {LoadingProvider} from './src/context/LoadingContext';
import {PasswordProtectionProvider} from './src/context/PasswordProtectionContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ClientsScreen from './src/screens/ClientsScreen';
import FoodStorageScreen from './src/screens/FoodStorageScreen';
import AlreadyActiveScreen from './src/screens/AlreadyActiveScreen';
import LoginScreen from './src/screens/LoginScreen';
import NoActiveScreen from './src/screens/NoActiveScreen';

// Components
import BottomTabBar from './src/components/BottomTabBar';
import {getItem, setItem} from './src/utils/localStorage';
import {getActiveUser, setActiveUser} from './src/utils/auth';
import {FIREBASE_ERROR} from './src/config/Constants';
import {FirebaseError} from './src/errors/FirebaseError';
import {useFirebase} from './src/context/FirebaseContext';
import {useLoading} from './src/context/LoadingContext';
import ClientDetailsScreen from './src/screens/ClientDetailsScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import StorageDetailsScreen from './src/screens/StorageDetailsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => {
  console.log('Rendering TabNavigator');
  return (
    <Tab.Navigator
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{headerShown: false}}
      initialRouteName="الرئيسية"
    >
      <Tab.Screen name="المخزن" component={FoodStorageScreen} />
      <Tab.Screen name="الحساب الشخصي" component={ProfileScreen} />
      <Tab.Screen name="العملاء" component={ClientsScreen} />
      <Tab.Screen name="الرئيسية" component={HomeScreen} />
    </Tab.Navigator>
  );
};

const App: React.FC = () => {
  console.log('Rendering App component');
  const {forceLoading} = useLoading();
  const {db} = useFirebase();
  const [initialScreen, setInitialScreen] = useState<string | null>(null);

  const checkAuth = async () => {
    console.log('Starting checkAuth');
    try {
      const name = await getItem('name');
      console.log('Retrieved name from storage:', name);
      if (!name) {
        console.log('No name found, setting initialScreen to Login');
        setInitialScreen("Login");
        return;
      }

      const active = await getItem('active');
      if (active) {
        console.log('Active user found, setting initialScreen to MainTabs');
        setInitialScreen('MainTabs');
        return;
      }

      const activeUser = await getActiveUser(db!);
      console.log('Retrieved active user from database:', activeUser);

      if (!activeUser) {
        console.log('No active user in database, attempting to set active user');
        const res = await setActiveUser(db!, name);
        if (res) {
          console.log('Set active user successful, setting initialScreen to NoActiveUser');
          setInitialScreen('NoActiveUser');
          return;
        }
      }

      if (activeUser && activeUser === name) {
        console.log('Current user is active user, setting active status and navigating to MainTabs');
        await setItem('active', true);
        setInitialScreen('MainTabs');
        return;
      }

      console.log('Another user is active, setting initialScreen to AlreadyActive');
      setInitialScreen('AlreadyActive');
    } catch (error) {
      console.error('Error in checkAuth:', error);
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERROR) {
          showMessage({
            message: 'Error',
            description: 'حدث خطأ ما , برجاء المحاولة مرة أخري لاحقا ',
            type: 'danger',
            duration: 3000,
            floating: true,
            autoHide: true,
          });
        } else {
          console.error('An error occurred with code:', error.code);
        }
      } else {
        console.error('An unexpected error occurred:', error);
      }
      console.log('Error occurred, defaulting to Login screen');
      setInitialScreen('Login');
    }
  };

  useEffect(() => {
    console.log('App useEffect triggered');
    checkAuth();
  }, []);

  console.log('Current initialScreen:', initialScreen);

  if (forceLoading || initialScreen === null) {
    console.log('Rendering loading screen');
    return (
      <SafeAreaView style={styles.splashContainer}>
        <LottieView
          source={require('./assets/lotties/splashScreen.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </SafeAreaView>
    );
  }

  console.log('Rendering main navigation structure');
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <FirebaseProvider>
        <LoadingProvider>
          <PasswordProtectionProvider>
            <NavigationContainer>
              <Stack.Navigator screenOptions={{headerShown: false}} initialRouteName={initialScreen}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="AlreadyActive" component={AlreadyActiveScreen} />
                <Stack.Screen name="NoActiveUser" component={NoActiveScreen} />
                <Stack.Screen name="MainTabs" component={TabNavigator} />
                <Stack.Screen name="ClientDetails" component={ClientDetailsScreen} />
                <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
                <Stack.Screen name="StorageDetails" component={StorageDetailsScreen} />
              </Stack.Navigator>
            </NavigationContainer>
            <FlashMessage position="top" floating={true} style={{ elevation: 1000 }} />
          </PasswordProtectionProvider>
        </LoadingProvider>
      </FirebaseProvider>
    </GestureHandlerRootView>
  );
};
  
const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  lottie: {
    width: '117%',
    height: '117%',
  },
  
});

export default App;