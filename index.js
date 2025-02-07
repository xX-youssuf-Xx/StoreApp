/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { LoadingProvider } from './src/context/LoadingContext';
import { FirebaseProvider } from './src/context/FirebaseContext';
import firebase from '@react-native-firebase/app';

// Initialize Firebase at app startup if not already initialized
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

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const Index = () => (
    <LoadingProvider>
        <FirebaseProvider>
            <App />
        </FirebaseProvider>
    </LoadingProvider>
)

AppRegistry.registerComponent(appName, () => Index);
