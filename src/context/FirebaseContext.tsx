/* eslint-disable react-hooks/exhaustive-deps */
import { firebase, FirebaseDatabaseTypes } from '@react-native-firebase/database';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { deleteItem } from '../utils/localStorage';
import { emptyActiveUser } from '../utils/auth';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNetInfo } from '@react-native-community/netinfo';

// Firebase web config
const firebaseConfig = {
  apiKey: "AIzaSyAJ5OZ34UfekaShL315qmgeERJ0zd5V55I",
  authDomain: "storeapp-44934.firebaseapp.com",
  databaseURL: "https://storeapp-44934-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "storeapp-44934",
  storageBucket: "storeapp-44934.firebasestorage.app",
  messagingSenderId: "640816735108",
  appId: "1:640816735108:web:0cca1848ee9fb63825f3d1",
  measurementId: "G-3P9XB447YS"
};

// Initialize Firebase if not already initialized
let app: any;
try {
  app = firebase.app();
} catch (error) {
  app = firebase.initializeApp(firebaseConfig);
}

interface FirebaseContextType {
  db: FirebaseDatabaseTypes.Module | null;
  backup: () => Promise<Boolean>;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider = ({ children }: FirebaseProviderProps) => {
  const [db, setDb] = useState<FirebaseDatabaseTypes.Module | null>(null);
  const netInfo = useNetInfo();

  // Use the initialized app
  const database = app.database(firebaseConfig.databaseURL);

  useEffect(() => {
    const initializeDB = async () => {
      try {
        // Disable persistence
        await database.setPersistenceEnabled(false);
        // Ensure data is always fetched from server
        await database.goOnline();
        setDb(database);
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };

    initializeDB();
  }, []);

  const backup = async () => {
    try {
      await deleteItem('active');
      await emptyActiveUser(database);
      return true;
    } catch (e) {
      console.log('ERROR');
      console.log(e);
      return false;
    }
  };

  if (!db) {
    return (
      <>
        <SafeAreaView style={styles.splashContainer}>
          <LottieView
            source={require('../../assets/lotties/splashScreen.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
        </SafeAreaView>
      </>
    );
  }

  return (
    <FirebaseContext.Provider value={{ db, backup }}>
      {children}
      {!netInfo.isConnected && (
        <View style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <MaterialIcons
            name="warning"
            size={80}
            color="#FFD700"
            style={{ marginBottom: 20 }}
          />
          <Text style={{
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 10,
            textAlign: 'center'
          }}>
            No Internet Connection
          </Text>
          <Text style={{
            color: '#cccccc',
            fontSize: 16,
            textAlign: 'center',
            paddingHorizontal: 40
          }}>
            Please check your internet connection and try again
          </Text>
        </View>
      )}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === null) {
    throw new Error('useFirebase must be used within a FirebaseContext');
  }
  return context;
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