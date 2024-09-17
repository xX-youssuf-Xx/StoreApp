import React, { useState } from 'react';
import { View, Text } from 'react-native';
import NavBar from '../components/NavBar';
import { setItem } from '../utils/localStorage';
import { addUser, getActiveUser, getUser, setActiveUser } from '../utils/auth';
import { FirebaseError } from '../errors/FirebaseError';
import { FIREBASE_ERROR } from '../config/Constants';
import { useFirebase } from '../context/FirebaseContext';

const ProfileScreen = () => {
  const [name, setName] = useState(); 
  const { db } = useFirebase(); 

  const submit = async () => {
    try {
      if(!name)
        return false;

      const user = await getUser(db!, name);
      if(!user) {
        await addUser(db!, name);
      }
      await setItem('name', name);
  
      const activeUser = await getActiveUser(db!);
  
      if(!activeUser) {
        const res = await setActiveUser(db!, name);  
        if(res) {
          await setItem('active', true);
          // JOE:  GO TO HOME
          return true;
        }
      }
  
      if(activeUser.val() === name) {
        await setItem('active', true);
        // JOE:  GO TO HOME 
        return true;
      }
  
      // JOE:  GO TO INACTIVE PAGE (show the user that there is already another user active and he should backup there first before being able to work here)
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERROR) {
          // JOE:  SHOW ERROR MESSAGE THAT THE USER SHOULD TRY AGAIN LATER
        } else {
            console.error('An error occurred with code:', error.code);
        }
      } else {
          console.error('An unexpected error occurred:', error);
      }
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
