import {firebase, FirebaseDatabaseTypes} from '@react-native-firebase/database';
import {createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState} from 'react';
import {useLoading} from './LoadingContext';
import {Text, View} from 'react-native';
import {deleteItem, setItem} from '../utils/localStorage';
import {emptyActiveUser} from '../utils/auth';
import Loading from '../components/Loading';
import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import LottieView from 'lottie-react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface FirebaseContextType {
  db: FirebaseDatabaseTypes.Module | null;
  backup: () => Promise<Boolean>;
  setShouldOnline: Dispatch<SetStateAction<Boolean>>;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider = ({children}: FirebaseProviderProps) => {
  const [db, setDb] = useState<FirebaseDatabaseTypes.Module | null>(null);
  const [shouldOnline, setShouldOnline] = useState<Boolean>(false);
  const [online, setOnline] = useState<Boolean>(true);
  const database = firebase
    .app()
    .database(
      'https://storeapp-44934-default-rtdb.europe-west1.firebasedatabase.app',
    );

  database.setPersistenceEnabled(true);

  const backup = async () => {
    try {
      setShouldOnline(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      if(online) {
        await deleteItem('active');
        await emptyActiveUser(database);
        return true;
      }
      return false;
    } catch (e) {
      console.log('ERROR');
      console.log(e);
      return false;
    }
  };

  const connectDB = async () => {
    setDb(database);
    database
    .ref('.info/connected')
    .on('value', snapshot => {
        console.log("snapshot.val()");
        console.log(snapshot.val());
        if (snapshot.val() === true) {
          console.log("DATABASE is online");
          setOnline(true);
        } else {
          console.log("DATABASE is offline");
          setOnline(false);
        }
      });
  };

  useEffect(() => {
    connectDB();
  }, []);

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
    <FirebaseContext.Provider value={{db, backup, setShouldOnline}}>
      {children}
      {shouldOnline && !online ? (
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
            style={{marginBottom: 20}}
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
      ) : null}
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
