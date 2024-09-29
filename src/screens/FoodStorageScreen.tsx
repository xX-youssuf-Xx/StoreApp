import {View, Text , StyleSheet , Button} from 'react-native';
import TopNav from '../../src/components/TopNav';
import React, {useEffect, useState} from 'react';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import { useFirebase } from '../context/FirebaseContext';
import { FIREBASE_CREATING_ERROR, FIREBASE_ERROR } from '../config/Constants';
import { FirebaseError } from '../errors/FirebaseError';
import { showMessage } from 'react-native-flash-message';
import { createItems, createProduct, getAllProducts, getProduct, getProductQrData } from '../utils/inventory';
import { getActiveUser } from '../utils/auth';
import QrReader from '../components/QrReader';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';


const FoodStorageScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [searchText, setSearchText] = useState('');
  const {db} = useFirebase();

  const getInventory = async () => {
    try {
      const products = await getAllProducts(db!);
      if(products) {
        // JOE: SET THE PRODUCTS
        console.log(products.كبدة.items);
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
    getInventory();
    getProductDetails('كبدة');
    // newProduct('كبدة');
    // importItem('كبدة', 50, 3, "]C101907101788118363201000380112406032156516901");
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



  const [isQrReaderVisible, setIsQrReaderVisible] = useState(false);
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);

  const handleScan = (data: string[]) => {
    setScannedCodes(data);
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
    <View>
      <Button title="Open QR Scanner" onPress={() => setIsQrReaderVisible(true)} />
      <QrReader
        isVisible={isQrReaderVisible}
        onClose={() => setIsQrReaderVisible(false)}
        onScan={handleScan}
      />
      <Text>Scanned Codes:</Text>
      {scannedCodes.map((code, index) => (
        <Text key={index}>{code}</Text>
      ))}
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
});

export default FoodStorageScreen;
