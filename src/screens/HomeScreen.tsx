import React, {useEffect, useState} from 'react';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {View, Text, Button, StyleSheet} from 'react-native';
import {useFirebase} from '../context/FirebaseContext';
import TopNav from '../../src/components/TopNav';
import { clearStorage } from '../utils/localStorage';

// Define the type for navigation prop
const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const {goOffline, backup} = useFirebase();

  useEffect(() => {
    // Go offline when the component mounts
    // goOffline();
    backup();
  }, []);

  const [searchText, setSearchText] = useState('');

  const handleSettingsPress = async () => {
    // Handle settings press
    // await clearStorage();
    console.log('Settings pressed');
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    // Perform search operation with the text
    console.log('Searching for:', text);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };
  
  return (
    <>
      <TopNav 
        title="الرئيسية" 
        onSettingsPress={handleSettingsPress}
        onSearchChange={handleSearchChange}
        onBackPress={handleBackPress}
        showBackButton={false}
        showSearchIcon={false}
      />
      {/* <View style={styles.splashContainer}>
        <Text>Home Screen</Text>

        <View style={{marginVertical: 10}}>
          <Button
            title="Go to hi"
            onPress={() => {
              console.log('Navigated to personal');
              navigation.navigate('الحساب الشخصي');
            }}
          />
        </View>

        <View style={{marginVertical: 10}}>
          <Button
            title="Go to Clients"
            onPress={() => navigation.navigate('العملاء')}
          />
        </View>

        <View style={{marginVertical: 10}}>
          <Button
            title="Go to Food Storage"
            onPress={() => navigation.navigate('المخزن')}
          />
        </View>
      </View> */}
    </>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'blue',
    zIndex: 15,
  },
});

export default HomeScreen;
