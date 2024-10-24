// First, let's define the Product interface properly
interface Product {
  name: string;  // Make name required
  itemCount: number;
  items?: Record<string, any>;
  isStatic: boolean;
  isQrable: boolean;
  boxWeight: number;
}

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
import AddButton from '../components/AddButton';
import CreateProduct from '../components/CreateProduct';
import LogoutMenu from '../components/LogoutComponent';

const FoodStorageScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [searchText, setSearchText] = useState('');
  const {db} = useFirebase();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const products = await getAllProducts(db!);
      if (products) {
        const formattedProducts = Object.entries(products).map(
          ([name, data]): Product => ({
            name,
            itemCount: Object.keys(data.items || {}).length,
            items: data.items,
            isStatic: Boolean(data.isStatic),
            isQrable: Boolean(data.isQrable),
            boxWeight: Number(data.boxWeight) || 0,
          }),
        );
        setProducts(formattedProducts);
        setFilteredProducts(formattedProducts);
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERROR) {
          const errorMessage = 'حدث خطأ ما , برجاء المحاولة مرة أخري لاحقا';
          setError(errorMessage);
          showMessage({
            message: 'Error',
            description: errorMessage,
            type: 'danger',
            duration: 3000,
            floating: true,
            autoHide: true,
          });
        } else {
          console.error('An error occurred with code:', error.code);
          setError('An unexpected error occurred');
        }
      } else {
        console.error('An unexpected error occurred:', error);
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getProductDetails = async (productName: string) => {
    try {
      const product = await getProduct(db!, productName);
      if (product) {
        console.log('Product details:', product);
        return product;
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERROR) {
          showMessage({
            message: 'Error',
            description: 'حدث خطأ ما , برجاء المحاولة مرة أخري لاحقا',
            type: 'danger',
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
    return null;
  };

  const newProduct = async (
    productName: string,
    isStatic: boolean = false,
    isQrable: boolean = false,
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
        console.log('Product created with key:', key);
        await getInventory();
        return key;
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === FIREBASE_ERROR) {
          showMessage({
            message: 'Error',
            description: 'حدث خطأ ما , برجاء المحاولة مرة أخري لاحقا',
            type: 'danger',
            duration: 3000,
            floating: true,
            autoHide: true,
          });
        } else if (error.code === FIREBASE_CREATING_ERROR) {
          showMessage({
            message: 'Error',
            description: 'Error creating product',
            type: 'danger',
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
    return null;
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
        console.log('Item created with key:', key);
        await getInventory();
        return key;
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        handleFirebaseError(error);
      } else {
        console.error('An unexpected error occurred:', error);
      }
    }
    return null;
  };

  const handleFirebaseError = (error: FirebaseError) => {
    if (error.code === FIREBASE_ERROR) {
      showMessage({
        message: 'Error',
        description: 'حدث خطأ ما , برجاء المحاولة مرة أخري لاحقا',
        type: 'danger',
        duration: 3000,
        floating: true,
        autoHide: true,
      });
    } else if (error.code === FIREBASE_CREATING_ERROR) {
      showMessage({
        message: 'Error',
        description: 'Error creating item',
        type: 'danger',
        duration: 3000,
        floating: true,
        autoHide: true,
      });
    } else {
      console.error('An error occurred with code:', error.code);
    }
  };

  const qrToWeight = async (productName: string, qrVal: string) => {
    try {
      const qrData = await getProductQrData(db!, productName);
      if (!qrData) {
        showMessage({
          message: 'Warning',
          description: 'This product is not QR-enabled',
          type: 'warning',
          duration: 3000,
          floating: true,
          autoHide: true,
        });
        return null;
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
        handleFirebaseError(error);
      } else {
        console.error('An unexpected error occurred:', error);
      }
      return null;
    }
  };

  useEffect(() => {
    getInventory();
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const handleSettingsPress = () => {
    console.log('Settings pressed');
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderProductItem = ({item}: {item: Product}) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => {
        navigation.navigate('ProductDetails', {product: item});
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

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchText
          ? 'No products found matching your search'
          : 'No products available'}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={getInventory}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
         {isMenuOpen && (
        <LogoutMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
      )}

      <TopNav
        title="المخزن"
 onSettingsPress={() => {    setIsMenuOpen(!isMenuOpen);
        }}        onSearchChange={handleSearchChange}
        onBackPress={handleBackPress}
        showBackButton={false}
        showSearchIcon={true}
      />
      <View style={styles.container}>
        {error ? (
          renderError()
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyList}
            refreshing={isLoading}
            onRefresh={getInventory}
          />
        )}
      </View>

      <AddButton refresh={getInventory}>
        {({closeModal, refresh}) => (
          <CreateProduct closeModal={closeModal} reloadProducts={refresh} />
        )}
      </AddButton>
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
    paddingBottom: 80,
  },
  productItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row-reverse',
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
    textAlign: 'left',
  },
  productAttributes: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'left',
  },
  productInfo: {
    alignItems: 'flex-start',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default FoodStorageScreen;