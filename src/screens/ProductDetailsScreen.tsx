import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import TopNav from '../../src/components/TopNav';
import { useFirebase } from '../context/FirebaseContext';
import { FirebaseError } from '../errors/FirebaseError';
import { FIREBASE_ERROR } from '../config/Constants';
import { showMessage } from 'react-native-flash-message';
import { getProduct } from '../utils/inventory';
import { Product, Item } from '../utils/types';

type RootStackParamList = {
  ProductDetails: { product: { name: string } };
};

type ProductDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetails'>;

// Update Item type to include qrString
interface ExtendedItem extends Item {
  qrString?: string;
}

const ProductDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ProductDetailsScreenRouteProp>();
  const { product } = route.params;
  const { db } = useFirebase();
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [productItems, setProductItems] = useState<(ExtendedItem & { id: string })[]>([]);

  useEffect(() => {
    if (db) {
      getProductDetails(product.name);
    }
  }, [product.name, db]);

  const getProductDetails = async (productName: string) => {
    try {
      if (!db) {
        throw new Error('Firebase database is not initialized');
      }
      const fetchedProduct = await getProduct(db, productName);
      if (fetchedProduct) {
        setProductDetails(fetchedProduct);
        const formattedItems = Object.entries(fetchedProduct.items).map(([id, item]) => ({
          id,
          ...(item as ExtendedItem),
        }));
        setProductItems(formattedItems);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleError = (error: unknown) => {
    if (error instanceof FirebaseError) {
      if (error.code === FIREBASE_ERROR) {
        showMessage({
          message: 'Error',
          description: 'حدث خطأ ما , برجاء المحاولة مرة أخري لاحقا ',
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
  };

  const renderItemDetails = ({ item }: { item: ExtendedItem & { id: string } }) => (
    <TouchableOpacity style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemWeight}>الوزن: {item.weight} كجم</Text>
        <Text style={styles.itemTotalWeight}>الوزن الكلي: {item.totalWeight} كجم</Text>
      </View>
      <View>
        <Text style={styles.itemPrice}>سعر الشراء: {item.boughtPrice} ج.م</Text>
        {item.qrString && <Text style={styles.itemQR}>QR: {item.qrString}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <TopNav
        title={`تفاصيل المنتج: ${product.name}`}
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
        showSearchIcon={false}
        onSettingsPress={() => {}}
        onSearchChange={() => {}}
      />
      <View style={styles.container}>
        {productDetails && (
          <View style={styles.productSummary}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productAttribute}>
              نوع: {productDetails.isStatic ? 'ثابت' : 'متغير'}
            </Text>
            <Text style={styles.productAttribute}>
              QR: {productDetails.isQrable ? 'نعم' : 'لا'}
            </Text>
            <Text style={styles.productAttribute}>
              وزن الصندوق: {productDetails.boxWeight} كجم
            </Text>
            <Text style={styles.productItemCount}>
              عدد العناصر: {productItems.length}
            </Text>
          </View>
        )}
        <FlatList
          data={productItems}
          renderItem={renderItemDetails}
          keyExtractor={item => item.id}
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
  productSummary: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  productAttribute: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  productItemCount: {
    fontSize: 18,
    color: '#4CAF50',
    marginTop: 10,
  },
  listContainer: {
    padding: 10,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  itemInfo: {
    alignItems: 'flex-end',
  },
  itemWeight: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  itemTotalWeight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  itemPrice: {
    fontSize: 14,
    color: '#4CAF50',
  },
  itemQR: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});

export default ProductDetailsScreen;