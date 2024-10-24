import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import TopNav from '../../src/components/TopNav';
import {useFirebase} from '../context/FirebaseContext';
import {FirebaseError} from '../errors/FirebaseError';
import {FIREBASE_ERROR} from '../config/Constants';
import {showMessage} from 'react-native-flash-message';
import {getProduct} from '../utils/inventory';
import {Product, Item} from '../utils/types';
import AddButton from '../components/AddButton';
import CreateItem from '../components/CreateItem';

type RootStackParamList = {
  ProductDetails: {product: {name: string}};
};

type ProductDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  'ProductDetails'
>;

interface ExtendedItem extends Item {
  qrString?: string;
}

const ProductDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ProductDetailsScreenRouteProp>();
  const {product} = route.params;
  const {db} = useFirebase();
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [productItems, setProductItems] = useState<
    (ExtendedItem & {id: string; isExpanded: boolean})[]
  >([]);

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
        const formattedItems = Object.entries(fetchedProduct.items).map(
          ([id, item]) => ({
            id,
            ...(item as ExtendedItem),
            isExpanded: false,
          }),
        );
        console.log('items:::' , formattedItems)
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

  const toggleItemExpansion = (id: string) => {
    setProductItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? {...item, isExpanded: !item.isExpanded} : item,
      ),
    );
  };

  const renderItemDetails = ({
    item,
  }: {
    item: ExtendedItem & {id: string; isExpanded: boolean};
  }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => toggleItemExpansion(item.id)}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemWeight}>الوزن: {item.weight} كجم</Text>
        <Text style={styles.itemPrice}>سعر الشراء: {item.boughtPrice} ج.م</Text>
      </View>
      <View>
        <Text style={styles.itemTotalWeight}>
          الوزن الكلي: {item.totalWeight} كجم
        </Text>
        {item.qrString && (
          <Text style={styles.itemQR}>
            الكود:{' '}
            {item.isExpanded
              ? item.qrString
              : `${item.qrString.substring(0, 10)}...`}
          </Text>
        )}
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
            <View style={styles.summaryRow}>
              <Text style={styles.productAttribute}>
                وزن الصندوق: {productDetails.boxWeight} كجم
              </Text>
              <Text style={styles.productAttribute}>
                نوع: {productDetails.isStatic ? 'ثابت' : 'متغير'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.productItemCount}>
                عدد العناصر: {productItems.length}
              </Text>
              <Text style={styles.productAttribute}>
                QR: {productDetails.isQrable ? 'نعم' : 'لا'}
              </Text>
            </View>
          </View>
        )}
        <FlatList
          data={productItems}
          renderItem={renderItemDetails}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      <AddButton refresh={() => getProductDetails(product.name)}>
        {({closeModal, refresh}) => (
          <CreateItem
            closeModal={closeModal}
            reloadProducts={refresh}
            productName={product.name}
          />
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
  productSummary: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  productAttribute: {
    fontSize: 14,
    color: '#666',
  },
  productItemCount: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 5,
  },
  listContainer: {
    padding: 10,
    paddingBottom: 80,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'column',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemWeight: {
    fontSize: 14,
    color: '#666',
  },
  itemTotalWeight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  itemPrice: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'left',
  },
  itemQR: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'left',
  },
  expandedQR: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  fullQRText: {
    fontSize: 12,
    color: '#333',
  },
});

export default ProductDetailsScreen;
