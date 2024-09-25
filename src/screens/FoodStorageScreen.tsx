import React from 'react';
import { View, Text } from 'react-native';
import NavBar from '../components/NavBar';
import { getAllProducts } from '../utils/inventory';
import { useFirebase } from '../context/FirebaseContext';
import { FirebaseError } from '../errors/FirebaseError';
import { FIREBASE_ERROR } from '../config/Constants';
import { showMessage } from 'react-native-flash-message';

const FoodStorageScreen = () => {
  const {db} = useFirebase();

  const getAllItems = async () => {
    try {
      await getAllProducts(db!);

    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERROR) {
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
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Food Storage Screen</Text>
      </View>
    </View>
  );
};

export default FoodStorageScreen;
