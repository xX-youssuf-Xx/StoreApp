import React, {useEffect, useState} from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import LottieView from 'lottie-react-native';
import FlashMessage, {showMessage} from 'react-native-flash-message';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ClientsScreen from './src/screens/ClientsScreen';
import FoodStorageScreen from './src/screens/FoodStorageScreen';
import AlreadyActiveScreen from './src/screens/AlreadyActiveScreen';
import LoginScreen from './src/screens/LoginScreen';
import NoActiveScreen from './src/screens/NoActiveScreen';

// Components
import NavBar from './src/components/NavBar';
import CustomTabBar from './src/components/CustomTabBar';
import {getItem, setItem} from './src/utils/localStorage';
import {getActiveUser, setActiveUser} from './src/utils/auth';
import {FIREBASE_ERROR} from './src/config/Constants';
import {FirebaseError} from './src/errors/FirebaseError';
import {useFirebase} from './src/context/FirebaseContext';
import {useLoading} from './src/context/LoadingContext';

const Tab = createBottomTabNavigator();

const App: React.FC = () => {
  const {forceLoading, setForceLoading} = useLoading();
  const {db} = useFirebase();
  const [initialScreen, setInitialScreen] = useState<string | null>(''); // Used to determine the initial screen

  const checkAuth = async () => {
    try {
      // CHECK IF THERE IS A NAME IN THE STORAGE
      const name = await getItem('name');
      if (!name) {
        // JOE: GO TO LOGIN PAGE
        setInitialScreen('Login');
        return true;
      }

      // CHECK IF ACTIVE FROM STORAGE
      const active = await getItem('active');
      if (active) {
        // JOE: GO TO HOME
        setInitialScreen('Home');
        return true;
      }

      const activeUser = await getActiveUser(db!);

      if (!activeUser) {
        const res = await setActiveUser(db!, name);
        if (res) {
          // JOE: GO TO THERE IS NO ACTIVE USER, DO YOU WANT TO BE ACTIVE??
          setInitialScreen('NoActiveUser');
          return true;
        }
      }

      if (activeUser.val() === name) {
        await setItem('active', true);
        // JOE: GO TO HOME
        setInitialScreen('Home');
        return true;
      }

      // JOE: GO TO AlreadyActive PAGE (show the user that there is already another user active and they should backup first before being able to work here)
      setInitialScreen('AlreadyActive');
      return true;
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERROR) {
          // JOE: SHOW ERROR MESSAGE THAT THE USER SHOULD TRY AGAIN LATER
          showMessage({
            message: 'Success',
            description: 'حدث خطأ ما , برجاء المحاولة مرة أخري لاحقا ',
            type: 'success',
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
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Show the Lottie splash screen if forceLoading or initial screen hasn't been determined
  if (forceLoading || initialScreen === null) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        {/* JOE: LOADING SCREEN */}
        <LottieView
          source={require('./assets/lotties/splashScreen.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <NavigationContainer>
        {/* NavBar is always displayed at the top */}

        {/* Bottom Tab Navigator */}
        <Tab.Navigator
          initialRouteName={initialScreen} // Renders the initial screen based on the logic
          tabBar={props => <CustomTabBar {...props} />} // Custom bottom tab like WhatsApp
          screenOptions={{headerShown: false}}>
          <Tab.Screen name="المخزن" component={FoodStorageScreen} />
          <Tab.Screen name="الحساب الشخصي" component={ProfileScreen} />
          <Tab.Screen name="العملاء" component={ClientsScreen} />
          <Tab.Screen name="الرئيسية" component={HomeScreen} />
          <FlashMessage position="top" />
        </Tab.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000', // Black background for the splash screen
  },
  lottie: {
    width: '117%',
    height: '117%',
  },
});

export default App;
