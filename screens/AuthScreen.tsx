import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import NavBar from '../components/NavBar';

const ProfileScreen = () => {
  const submit = () => {
    const nameExists = false;

    if(nameExists) {
      // ADD THIS NAME TO THE LOCAL STORAGE
    } else {
      // ADD NEW NAME AND ADD IT TO STORAGE
    }

    // CHECK IF THERE IS AN ACTIVE USER
    const activeExists = false;
    if(activeExists) {
      // NAVIGATE TO INACTIVE PAGE
    } else {
      // MARK THIS NAME AS ACTIVE, GET THE LATEST BACKUP, NAVIGATE TO HOME
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <NavBar title="Profile" />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Profile Screen</Text>
      </View>
    </View>
  );
};

export default ProfileScreen;
