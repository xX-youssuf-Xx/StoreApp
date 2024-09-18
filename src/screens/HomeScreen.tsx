import React, { useEffect } from 'react';
import { View, Text, Button  , StyleSheet } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useFirebase } from '../context/FirebaseContext';

// Define the type for navigation prop
const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { goOffline } = useFirebase();

  useEffect(() => {
    // Go offline when the component mounts
    goOffline();
  }, []);

  return (
    <View style={styles.splashContainer}>
      <Text>Home Screen</Text>

      <View style={{ marginVertical: 10 }}>
        <Button 
          title="Go to hi" 
          onPress={() => {
            console.log('Navigated to personal');
            navigation.navigate('الحساب الشخصي');
          }} 
        />
      </View>

      <View style={{ marginVertical: 10 }}>
        <Button 
          title="Go to Clients" 
          onPress={() => navigation.navigate('العملاء')} 
        />
      </View>

      <View style={{ marginVertical: 10 }}>
        <Button 
          title="Go to Food Storage" 
          onPress={() => navigation.navigate('المخزن')} 
        />
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'blue',
    zIndex:15
  }
});

export default HomeScreen;
