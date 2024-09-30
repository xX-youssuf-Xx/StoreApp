import {View, Text} from 'react-native';
import TopNav from '../../src/components/TopNav';
import React, {useEffect, useState} from 'react';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import { useFirebase } from '../context/FirebaseContext';
import { FIREBASE_CREATING_ERROR, FIREBASE_ERROR } from '../config/Constants';
import { FirebaseError } from '../errors/FirebaseError';
import { showMessage } from 'react-native-flash-message';
import { createItems, createProduct, getAllProducts, getProduct, getProductQrData } from '../utils/inventory';
import { getActiveUser } from '../utils/auth';

const FoodStorageScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [searchText, setSearchText] = useState('');
  const {db} = useFirebase();

  const getInventory = async () => {
    try {
      const products = await getAllProducts(db!);
      if(products) {
        console.log("inventory");
        console.log(products['كبدة']);
        // JOE: SET THE PRODUCTS
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERROR) {
          console.log("ERROR");
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

  const getProductDetails = async (productName: string) => {
    try {
      const product = await getProduct(db!, productName);
      if(product) {
        console.log(product);
        // JOE: SET THE PRODUCT DETAILS (AND ITS ITEMS)
      }
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

  const newProduct = async (productName: string, isStatic: Boolean = false, isQrable: Boolean = false, boxWeight: number = 0) => {
    try {
      const key = await createProduct(db!, productName, isStatic, isQrable, boxWeight);
      if(key) {
        console.log(key);
        // JOE: SET THE PRODUCT DETAILS (AND ITS ITEMS)
      }
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
        } else if (error.code === FIREBASE_CREATING_ERROR) {
          // JOE: ERROR CREATING THE INSTANCE
        } else {
          console.error('An error occurred with code:', error.code);
        }
      } else {
        console.error('An unexpected error occurred:', error);
      }
    }
  }

  const importItem = async (productName: string, boughtPrice: number, weight: number, qrString: string = "") => {
    try {
      const key = await createItems(db!, productName, boughtPrice, weight, qrString);
      if(key) {
        console.log(key);
        // JOE: SET THE PRODUCT DETAILS (AND ITS ITEMS)
      }
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
        } else if (error.code === FIREBASE_CREATING_ERROR) {
          // JOE: ERROR CREATING THE INSTANCE
        } else {
          console.error('An error occurred with code:', error.code);
        }
      } else {
        console.error('An unexpected error occurred:', error);
      }
    }
  }

  const qrToWeight = async (productName: string, qrVal: string) => {
    try {
      const qrData = await getProductQrData(db!, productName);
      if(!qrData) {
        // JOE: THIS PRODUCT IS NOT QRABLE
        return;
      }
      const intVal = qrVal.slice(qrData.from - 1, qrData.from - 1 + qrData.intLength);
      const floatVal = qrVal.slice(qrData.from + qrData.intLength, qrData.from + qrData.intLength + qrData.floatLength);

      return `${intVal}.${floatVal}`;
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

  useEffect(() => {
    // getProductDetails('كبدة');
    // newProduct('كبدة');
    // importItem('كبدة', 300, 3, "]C101907101788118363201000380112406032156516901");
    // getInventory();
  }, []);
  
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
        title="المخزن"
        onSettingsPress={handleSettingsPress}
        onSearchChange={handleSearchChange}
        onBackPress={handleBackPress}
        showBackButton={false}
        showSearchIcon={true}
      />
      <View style={{flex: 1}}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text>Food Storage Screen</Text>
        </View>
      </View>
    </>
  );
};

export default FoodStorageScreen;
