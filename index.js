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

const Index = () => (
    <LoadingProvider>
        <FirebaseProvider>
            <App />
        </FirebaseProvider>
    </LoadingProvider>
)

AppRegistry.registerComponent(appName, () => Index);
