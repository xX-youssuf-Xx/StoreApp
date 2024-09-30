import {
  View,
  Text,
  StyleSheet,
  Button,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import TopNav from '../../src/components/TopNav';
import React, {useEffect, useState} from 'react';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {useFirebase} from '../context/FirebaseContext';
import {FIREBASE_CREATING_ERROR, FIREBASE_ERROR} from '../config/Constants';
import {FirebaseError} from '../errors/FirebaseError';
import {showMessage} from 'react-native-flash-message';
import {
  createItems,
  createProduct,
  getAllProducts,
  getProduct,
  getProductQrData,
} from '../utils/inventory';
import {getActiveUser} from '../utils/auth';
import QrReader from '../components/QrReader';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import {Product} from '../utils/types';

const FoodStorageScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [searchText, setSearchText] = useState('');
  const {db} = useFirebase();
  const [products, setProducts] = useState<Product[]>([]);

  const getInventory = async () => {
    try {
      const products = await getAllProducts(db!);
      if (products) {
        const formattedProducts = Object.entries(products).map(
          ([name, data]) => ({
            name,
            itemCount: Object.keys(data.items || {}).length,
            items: data.items,
            isStatic: data.isStatic,
            isQrable: data.isQrable,
            boxWeight: data.boxWeight,
          }),
        );
        setProducts(formattedProducts);
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERROR) {
          console.log('ERROR');
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
  };

  const getProductDetails = async (productName: string) => {
    try {
      const product = await getProduct(db!, productName);
      if (product) {
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
  };

  const newProduct = async (
    productName: string,
    isStatic: Boolean = false,
    isQrable: Boolean = false,
    boxWeight: number = 0,
  ) => {
    try {
      const key = await createProduct(
        db!,
        productName,
        isStatic,
        isQrable,
        boxWeight,
      );
      if (key) {
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
  };

  const importItem = async (
    productName: string,
    boughtPrice: number,
    weight: number,
    qrString: string = '',
  ) => {
    try {
      const key = await createItems(
        db!,
        productName,
        boughtPrice,
        weight,
        qrString,
      );
      if (key) {
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
  };

  const qrToWeight = async (productName: string, qrVal: string) => {
    try {
      const qrData = await getProductQrData(db!, productName);
      if (!qrData) {
        // JOE: THIS PRODUCT IS NOT QRABLE
        return;
      }
      const intVal = qrVal.slice(
        qrData.from - 1,
        qrData.from - 1 + qrData.intLength,
      );
      const floatVal = qrVal.slice(
        qrData.from + qrData.intLength,
        qrData.from + qrData.intLength + qrData.floatLength,
      );

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
  };

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

  const renderProductItem = ({item}: {item: Product}) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => {
        navigation.navigate('ProductDetails', { product: item })
      }}>
      <View style={styles.productInfo}>
        <Text style={styles.productItemCount}>العناصر: {item.itemCount}</Text>
        <Text style={styles.productBoxWeight}>
          وزن الصندوق: {item.boxWeight} كجم
        </Text>
      </View>
      <View>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productAttributes}>
          {item.isStatic ? 'ثابت' : 'متغير'} | {item.isQrable ? 'QR' : 'غير QR'}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
      <View style={styles.container}>
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item, index) => item.name ?? index.toString()}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 10,
  },
  productItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  productAttributes: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
  },
  productInfo: {
    alignItems: 'flex-end',
  },
  productItemCount: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 5,
  },
  productBoxWeight: {
    fontSize: 14,
    color: '#2196F3',
  },
});

export default FoodStorageScreen;
