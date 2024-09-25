import {View, Text} from 'react-native';
import TopNav from '../../src/components/TopNav';
import React, {useEffect, useState} from 'react';
import {NavigationProp, useNavigation} from '@react-navigation/native';
const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();

  const [searchText, setSearchText] = useState('');

  const handleSettingsPress = () => {
    // Handle settings press
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
        title="الحساب الشخصي"
        onSettingsPress={handleSettingsPress}
        onSearchChange={handleSearchChange}
        onBackPress={handleBackPress}
        showBackButton={false}
        showSearchIcon={true}
      />
      <View style={{flex: 1, backgroundColor: 'red'}}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text>Profile Screen</Text>
        </View>
      </View>
    </>
  );
};

export default ProfileScreen;
