import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, BackHandler} from 'react-native';
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
import ConfirmationModal from '../components/ConfirmationModal';
import Icon from 'react-native-vector-icons/FontAwesome';


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

const convertKgToLb = (kg: number): number => {
  return kg / 0.455;
};

const formatNumberTo4Decimals = (num: number): string => {
  let numStr = num.toString();
  const parts = numStr.split('.');
  if (parts.length === 1) parts.push('0000');
  if (parts[1].length < 4) {
    parts[1] = parts[1].padEnd(4, '0');
  } else if (parts[1].length > 4) {
    parts[1] = parts[1].substring(0, 4);
  }
  return parts.join('.');
};

const ProductDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ProductDetailsScreenRouteProp>();
  const {product} = route.params;
  const {db} = useFirebase();
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [productItems, setProductItems] = useState<
    (ExtendedItem & {id: string; isExpanded: boolean})[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const getProductDetails = async (productName: string) => {
    try {
      if (!db) {
        throw new Error('Firebase database is not initialized');
      }
      
      // Add debug logging
      console.log('Fetching product details for:', productName);
      
      const fetchedProduct = await getProduct(db, productName);
      
      // Debug log the raw fetched data
      console.log('Raw fetched product:', JSON.stringify(fetchedProduct, null, 2));
      
      if (fetchedProduct) {
        setProductDetails(fetchedProduct);
        
        // Check if items exist
        if (!fetchedProduct.items) {
          console.log('No items found in fetched product');
          setProductItems([]);
          return;
        }

        console.log('Raw items:', fetchedProduct.items);
        
        const formattedItems = Object.entries(fetchedProduct.items)
          .filter(([_, data]) => data !== null && data !== undefined) // Filter out null/undefined items
          .map(([id, item]) => {
            console.log(`Processing item ${id}:`, item); // Debug log each item
            return {
              id,
              ...(item as ExtendedItem),
              isExpanded: false,
            };
          })
          .filter(item => {
            const isValid = item && item.weight > 0;
            if (!isValid) {
              console.log('Filtering out invalid item:', item);
            }
            return isValid;
          })
          .sort((a, b) => a.order - b.order);

        console.log('Formatted items:', formattedItems);
        
        setProductItems(formattedItems);
      } else {
        console.log('No product found');
        setProductItems([]);
        setProductDetails(null);
      }
    } catch (error) {
      console.error('Error in getProductDetails:', error);
      handleError(error);
    }
  };

  // Add cleanup on component unmount
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (db && mounted) {
        await getProductDetails(product.name);
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [product.name, db]);

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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    getProductDetails(product.name).finally(() => setRefreshing(false));
  }, [product.name]);

  const toggleSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
      if (newSelection.size === 0) {
        setSelectionMode(false);
      }
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedItems(new Set());
  };

  const deleteSelected = () => {
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    try {
      // Add your delete logic here
      console.log('Deleting items:', Array.from(selectedItems));
      setIsDeleteModalVisible(false);
      cancelSelection();
      // Refresh the list
      await getProductDetails(product.name);
      showMessage({
        message: 'تم الحذف بنجاح',
        type: 'success',
        duration: 3000,
        floating: true,
      });
    } catch (error) {
      showMessage({
        message: 'حدث خطأ',
        description: 'فشل في حذف القطع',
        type: 'danger',
        duration: 3000,
        floating: true,
      });
    }
  };

  const onLongPressItem = (itemId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
    }
    toggleSelection(itemId);
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectionMode) {
        cancelSelection();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [selectionMode]);

  const renderItemDetails = ({
    item,
  }: {
    item: ExtendedItem & {id: string; isExpanded: boolean};
  }) => {
    const isSelected = selectedItems.has(item.id);

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => {
          if (selectionMode) {
            toggleSelection(item.id);
          } else {
            toggleItemExpansion(item.id);
          }
        }}
        onLongPress={() => onLongPressItem(item.id)}>
        <View style={styles.itemInfo}>
          {selectionMode && (
            <View style={styles.checkIconContainer}>
              {isSelected && (
                <View style={styles.checkIcon}>
                  <Icon name="check" size={17} color="#fff" />
                </View>
              )}
            </View>
          )}
          <Text style={styles.itemWeight}>
            الوزن: {(productDetails && productDetails?.isStatic) ? 
              item.weight + ' kg' : 
              formatNumberTo4Decimals(convertKgToLb(item.weight)) + ' lb'
            }
          </Text>
          <Text style={styles.itemPrice}>سعر الشراء: {item.boughtPrice} ج.م</Text>
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.itemTotalWeight}>
            الوزن الكلي: {(productDetails && productDetails?.isStatic) ? item.totalWeight + ' kg' : formatNumberTo4Decimals(convertKgToLb(item.totalWeight)) + ' lb'} 
          </Text>

          {item.qrString && (
            <Text style={styles.itemQR}>
              الكود:{' '}
              {item.isExpanded
                ? item.qrString
                : `${item.qrString.substring(0, 10)}...`}
            </Text>
          )}

          {(productDetails && productDetails?.isStatic) && (
            <Text style={styles.itemWeight}>
              عدد العبوات: {Math.floor(item.weight / productDetails.boxWeight)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {selectionMode && (
        <View style={styles.selectionNavbar}>
          <TouchableOpacity onPress={cancelSelection} style={styles.selectionNavButton}>
            <Icon name="chevron-right" size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.selectionCount}>
            تم اختيار {selectedItems.size} {selectedItems.size === 1 ? 'قطعة' : 'قطع'}
          </Text>
          <TouchableOpacity onPress={deleteSelected} style={styles.selectionNavButton}>
            <Icon name="trash" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      )}
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
                وزن العبوة: {productDetails.boxWeight} كجم
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2196F3']} // Android
              tintColor="#2196F3" // iOS
            />
          }
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
      <ConfirmationModal
        visible={isDeleteModalVisible}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        title="حذف القطع"
        message="لا يمكن التراجع عن هذا الإجراء"
        itemType="items"
        count={selectedItems.size}
      />
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
    flexDirection: 'row-reverse',
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
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemDetails: {
    flexDirection: 'column',
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
  selectionNavbar: {
    height: 60,
    backgroundColor: '#f8f8f8',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },
  selectionCount: {
    color: '#000',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'right',
  },
  selectionNavButton: {
    padding: 10,
  },
  checkIcon: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    width: 23,
    height: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIconContainer: {
    position: 'absolute',
    top: -18,
    right: -18,
    zIndex: 5,
  },
});

export default ProductDetailsScreen;
