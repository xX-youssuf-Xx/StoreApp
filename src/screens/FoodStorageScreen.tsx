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
  RefreshControl,
  Alert,
  BackHandler,
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

import FileViewer from 'react-native-file-viewer';
import {format} from 'date-fns';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { cowLogoBase64 } from '../utils/imageAssets';
import ConfirmationModal from '../components/ConfirmationModal';
import Icon from 'react-native-vector-icons/FontAwesome';

const FoodStorageScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [searchText, setSearchText] = useState('');
  const {db} = useFirebase();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const getInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const products = await getAllProducts(db!);
      if (products) {
        
        const formattedProducts = Object.entries(products).map(
          ([name, data]): Product => {
            // Count only items with weight > 0
            const validItemsCount = Object.values(data.items || {}).filter(
              (item: any) => item && item.weight > 0
            ).length;

            return {
              name,
              itemCount: validItemsCount, // Use the filtered count
              items: data.items,
              isStatic: Boolean(data.isStatic),
              isQrable: Boolean(data.isQrable),
              boxWeight: Number(data.boxWeight) || 0,
            };
          }
        );
        
        // console.log('Formatted products with valid item counts:', formattedProducts);
        setProducts(formattedProducts);
        setFilteredProducts(formattedProducts);
        console.log('Products:--> ', JSON.stringify(formattedProducts, null, 2));
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
      });
    } else if (error.code === FIREBASE_CREATING_ERROR) {
      showMessage({
        message: 'Error',
        description: 'Error creating item',
        type: 'danger',
        duration: 3000,
        floating: true,
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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    getInventory().finally(() => setRefreshing(false));
  }, []);

  const toggleSelection = (productName: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productName)) {
      newSelection.delete(productName);
      if (newSelection.size === 0) {
        setSelectionMode(false);
      }
    } else {
      newSelection.add(productName);
    }
    setSelectedProducts(newSelection);
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedProducts(new Set());
  };

  const deleteSelected = () => {
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    try {
      // Add your delete logic here
      console.log('Deleting products:', Array.from(selectedProducts));
      setIsDeleteModalVisible(false);
      cancelSelection();
      await getInventory(); // Refresh the list
      showMessage({
        message: 'تم الحذف بنجاح',
        type: 'success',
        duration: 3000,
        floating: true,
      });
    } catch (error) {
      showMessage({
        message: 'حدث خطأ',
        description: 'فشل في حذف المنتجات',
        type: 'danger',
        duration: 3000,
        floating: true,
      });
    }
  };

  const onLongPressProduct = (productName: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
    }
    toggleSelection(productName);
  };

  const renderProductItem = ({item}: {item: Product}) => {
    const isSelected = selectedProducts.has(item.name);

    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() => {
          if (selectionMode) {
            toggleSelection(item.name);
          } else {
            navigation.navigate('ProductDetails', {product: item});
          }
        }}
        onLongPress={() => onLongPressProduct(item.name)}>
        <View style={styles.productInfo}>
          {selectionMode && (
            <View style={styles.checkIconContainer}>
              {isSelected && (
                <View style={styles.checkIcon}>
                  <Icon name="check" size={17} color="#fff" />
                </View>
              )}
            </View>
          )}
          <Text style={styles.productItemCount}>العناصر: {item.itemCount}</Text>
          <Text style={styles.productBoxWeight}>
            وزن العبوة: {item.boxWeight} كجم
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
  };

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

  const printSummary = async () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @page { size: A5 portrait; margin: 5mm; }
              body {
                font-family: 'Cairo', Arial, sans-serif;
                margin: 0;
                padding: 10px;
                background-color: white;
              }
              .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
                padding: 10px;
              }
              
              .header-right {
                order: 1;
              }
              
              .header-center {
                order: 2;
                text-align: center;
                flex-grow: 1;
              }
              
              .header-left {
                order: 3;
                text-align: left;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
              }
  
              .logo {
                width: 60px;
                height: 60px;
              }
              .company-info {
                text-align: center;
                margin-bottom: 20px;
              }
              .company-name {
                font-size: 24px;
                font-weight: bold;
                margin: 5px 0;
              }
              .company-phone {
                font-size: 16px;
                color: #666;
              }
              .title {
                font-size: 28px;
                text-align: center;
                margin: 15px 0;
                color: #000;
                font-weight: bold;
              }
              .date {
                font-size: 16px;
                text-align: center;
                color: #666;
                margin: 15px 0 25px 0;
                font-weight: bold;
              }
              .products-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              .products-table th {
                background-color: #e9ecef;
                color: #2196F3;
                padding: 10px;
                text-align: center;
                border: 1px solid #dee2e6;
                font-size: 16px;
              }
              .products-table td {
                padding: 8px;
                text-align: center;
                border: 1px solid #dee2e6;
                font-size: 14px;
              }
              .products-table tr:nth-child(even) {
                background-color: #f8f9fa;
              }
              .product-name {
                text-align: right;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-right">
                <img src="${cowLogoBase64}" class="logo" />
              </div>
              <div class="header-center">
                <div class="company-name">البركة للحوم المجمدة</div>
              </div>
              <div class="header-left">
                <div class="contact-info">التاريخ: ${new Date().toLocaleDateString('ar-EG')}</div>
                <div class="contact-info">ت/01024963110</div>
              </div>
            </div>
            
            <div class="title">ملخص المخزون</div>
  
            <table class="products-table">
              <thead>
                <tr>
                  <th>اسم المنتج</th>
                  <th>الكمية المتبقية</th>
                  <th>متوسط السعر</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(products)
                  .map(([name, product]) => {
                    // Filter items with weight > 0
                    const validItems = Object.values(product.items || {}).filter(
                      item => item.weight > 0
                    );
  
                    if (validItems.length > 0) {
                      let remainingWeight = validItems.reduce(
                        (sum, item) => sum + item.weight,
                        0
                      );
                      const avgPrice = validItems.reduce(
                        (sum, item) => sum + item.boughtPrice,
                        0
                      ) / validItems.length;
  
                      // For static products, divide by boxWeight
                      if (product.isStatic && product.boxWeight > 0) {
                        remainingWeight = remainingWeight / product.boxWeight;
                      }
  
                      const unit = product.isStatic ? 'قطعة' : 'كيلو';
  
                      return `
                        <tr>
                          <td class="product-name">${product.name}</td>
                          <td>${remainingWeight.toFixed(2)} ${unit}</td>
                          <td>${avgPrice.toFixed(2)} ج.م</td>
                        </tr>
                      `;
                    }
                    return '';
                  })
                  .join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
  
      const options = {
        html: htmlContent,
        fileName: 'inventory_summary',
        directory: 'Documents',
        width: 148,
        height: 210,
      };
  
      const file = await RNHTMLtoPDF.convert(options);
  
      if (file.filePath) {
        await FileViewer.open(file.filePath, {showOpenWithDialog: true});
      } else {
        throw new Error('PDF file path is undefined');
      }
    } catch (error) {
      console.error('Error generating or opening PDF:', error);
      Alert.alert('Error', `Failed to generate or open the PDF: ${error}`);
    }
  };

  return (
    <>
      {selectionMode && (
        <View style={styles.selectionNavbar}>
          <TouchableOpacity onPress={cancelSelection} style={styles.selectionNavButton}>
            <Icon name="chevron-right" size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.selectionCount}>تم اختيار {selectedProducts.size}</Text>
          <TouchableOpacity onPress={deleteSelected} style={styles.selectionNavButton}>
            <Icon name="trash" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      )}
      {isMenuOpen && (
        <LogoutMenu
          isFoodStorage={false}
          isOpen={isMenuOpen}
          onGetSummary={printSummary}
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2196F3']} // Android
                tintColor="#2196F3" // iOS
              />
            }
          />
        )}
      </View>

      <AddButton refresh={getInventory}>
        {({closeModal, refresh}) => (
          <CreateProduct closeModal={closeModal} reloadProducts={refresh} />
        )}
      </AddButton>

      <ConfirmationModal
        visible={isDeleteModalVisible}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        title="حذف المنتجات"
        message="لا يمكن التراجع عن هذا الإجراء"
        itemType="products"
        count={selectedProducts.size}
      />
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
    alignItems: 'flex-start',
  },
  productItemCount: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 5,
    textAlign: 'right',
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
  selectionNavbar: {
    height: 60,
    backgroundColor: '#f8f8f8',
    flexDirection: 'row',
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

export default FoodStorageScreen;